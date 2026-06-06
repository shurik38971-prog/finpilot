import type { SupabaseClient } from "@supabase/supabase-js";
import { createTaskImpacts } from "@/lib/ai/create-task-impacts";
import { syncPendingTaskPriorities } from "@/lib/ai/sync-task-priorities";
import { BENEFIT_LABELS } from "@/lib/copy/ui";
import { computeDashboardSummary } from "@/lib/finance/index";
import { matchTaskToGoal } from "@/lib/finance/match-task-to-goal";
import { normalizeTaskTitle } from "@/lib/finance/normalize-task-title";
import type { Debt, Expense, Income } from "@/types/database";
import type {
  AiAction30Day,
  AiAnalysisResult,
  NextBestAction,
} from "@/types/analysis";
import type { FinancialGoal } from "@/types/goals";
import { addDays, format } from "date-fns";

const MAX_TASKS_PER_ANALYSIS = 5;

const PRIORITY_SCORE: Record<string, number> = {
  high: 75,
  medium: 50,
  low: 25,
};

const PRIORITY_LABEL: Record<string, string> = {
  high: BENEFIT_LABELS.high,
  medium: BENEFIT_LABELS.medium,
  low: BENEFIT_LABELS.low,
};

export interface CreateTasksFromAnalysisResult {
  created_tasks_count: number;
  skipped_duplicate_tasks_count: number;
}

interface TaskInsert {
  user_id: string;
  analysis_id: string;
  goal_id: string | null;
  goal_progress_amount: number | null;
  title: string;
  normalized_title: string;
  description: string | null;
  impact_score: number;
  impact_label: string | null;
  due_date: string | null;
}

function dueDateFromDays(days?: number): string | null {
  if (!days || days < 1) return null;
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

function attachGoal(
  title: string,
  description: string | null,
  goals: FinancialGoal[],
  debtTitles: string[]
): Pick<TaskInsert, "goal_id" | "goal_progress_amount"> {
  const match = matchTaskToGoal(title, description, goals, debtTitles);
  return {
    goal_id: match.goalId,
    goal_progress_amount: match.progressAmount,
  };
}

function mapNextBestAction(
  action: NextBestAction,
  userId: string,
  analysisId: string,
  goals: FinancialGoal[],
  debtTitles: string[]
): TaskInsert {
  const title = action.title.trim();
  const description = action.description?.trim() ?? null;
  const goalLink = attachGoal(title, description, goals, debtTitles);

  return {
    user_id: userId,
    analysis_id: analysisId,
    ...goalLink,
    title,
    normalized_title: normalizeTaskTitle(title),
    description,
    impact_score: Math.min(100, Math.max(1, action.impact_score ?? 80)),
    impact_label: action.impact_label ?? BENEFIT_LABELS.high,
    due_date: dueDateFromDays(action.due_days ?? 7),
  };
}

function mapAction30Day(
  action: AiAction30Day,
  userId: string,
  analysisId: string,
  goals: FinancialGoal[],
  debtTitles: string[]
): TaskInsert {
  const priority = action.priority ?? "medium";
  const title = action.action.trim();
  const description = action.effect?.trim() ?? null;
  const goalLink = attachGoal(title, description, goals, debtTitles);

  return {
    user_id: userId,
    analysis_id: analysisId,
    ...goalLink,
    title,
    normalized_title: normalizeTaskTitle(title),
    description,
    impact_score: PRIORITY_SCORE[priority] ?? 50,
    impact_label: PRIORITY_LABEL[priority] ?? BENEFIT_LABELS.medium,
    due_date: dueDateFromDays(30),
  };
}

export async function createTasksFromAnalysis(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string,
  parsed: AiAnalysisResult
): Promise<CreateTasksFromAnalysisResult> {
  const emptyResult: CreateTasksFromAnalysisResult = {
    created_tasks_count: 0,
    skipped_duplicate_tasks_count: 0,
  };

  const [
    { data: activeTasks },
    { data: goals },
    { data: debts },
    { data: incomes },
    { data: expenses },
  ] = await Promise.all([
    supabase
      .from("financial_tasks")
      .select("id, normalized_title, title")
      .eq("user_id", userId)
      .in("status", ["pending", "postponed"]),
    supabase.from("financial_goals").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase.from("incomes").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
  ]);

  const userGoals = (goals ?? []) as FinancialGoal[];
  const debtTitles = (debts ?? []).map((d) => d.title);

  const existingNormalized = new Set(
    (activeTasks ?? [])
      .map((task) =>
        task.normalized_title
          ? task.normalized_title
          : normalizeTaskTitle(task.title ?? "")
      )
      .filter(Boolean)
  );

  const batchNormalized = new Set<string>();
  const toInsert: TaskInsert[] = [];
  let skippedDuplicateTasksCount = 0;

  function tryAddTask(task: TaskInsert) {
    const normalized = task.normalized_title;
    if (!normalized) return;

    if (existingNormalized.has(normalized) || batchNormalized.has(normalized)) {
      skippedDuplicateTasksCount += 1;
      return;
    }

    batchNormalized.add(normalized);
    toInsert.push(task);
  }

  if (parsed.next_best_action?.title) {
    tryAddTask(
      mapNextBestAction(
        parsed.next_best_action,
        userId,
        analysisId,
        userGoals,
        debtTitles
      )
    );
  }

  for (const action of parsed.actions_30_days ?? []) {
    if (toInsert.length >= MAX_TASKS_PER_ANALYSIS) break;
    if (!action.action?.trim()) continue;

    tryAddTask(
      mapAction30Day(action, userId, analysisId, userGoals, debtTitles)
    );
  }

  if (toInsert.length === 0) {
    return {
      created_tasks_count: 0,
      skipped_duplicate_tasks_count: skippedDuplicateTasksCount,
    };
  }

  const { data: inserted, error } = await supabase
    .from("financial_tasks")
    .insert(toInsert)
    .select("id, title, description, impact_score, goal_id, goal_progress_amount");

  if (error) {
    console.error("Failed to create financial tasks:", error);
    return emptyResult;
  }

  await createTaskImpacts(supabase, userId, inserted ?? [], {
    incomes: (incomes ?? []) as Income[],
    expenses: (expenses ?? []) as Expense[],
    debts: (debts ?? []) as Debt[],
    goals: userGoals,
  });

  const summary = computeDashboardSummary(
    (incomes ?? []) as Income[],
    (expenses ?? []) as Expense[],
    (debts ?? []) as Debt[]
  );
  await syncPendingTaskPriorities(supabase, userId, {
    hasNegativeCashflow: summary.netCashFlow < 0,
  });

  return {
    created_tasks_count: inserted?.length ?? 0,
    skipped_duplicate_tasks_count: skippedDuplicateTasksCount,
  };
}
