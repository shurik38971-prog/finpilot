import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createTaskImpacts,
  refreshTaskImpacts,
} from "@/lib/ai/create-task-impacts";
import { syncPendingTaskPriorities } from "@/lib/ai/sync-task-priorities";
import { getProfileTypeForUser } from "@/lib/actions/profile";
import { deduplicateUserTasksForUser } from "@/lib/finance/deduplicate-user-tasks";
import { BENEFIT_LABELS } from "@/lib/copy/ui";
import {
  detectTaskCategory,
  type TaskCategory,
} from "@/lib/finance/detect-task-category";
import { computeDashboardSummary } from "@/lib/finance/index";
import { matchTaskToGoal } from "@/lib/finance/match-task-to-goal";
import { normalizeTaskTitle } from "@/lib/finance/normalize-task-title";
import {
  isMoreSpecificTask,
  pickBetterTask,
} from "@/lib/finance/pick-better-task";
import { calculateTaskPriority } from "@/lib/services/task-priority";
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
  updated_tasks_count: number;
  skipped_duplicate_tasks_count: number;
}

interface TaskCandidate {
  user_id: string;
  analysis_id: string;
  goal_id: string | null;
  goal_progress_amount: number | null;
  title: string;
  normalized_title: string;
  task_category: TaskCategory;
  description: string | null;
  impact_score: number;
  impact_label: string | null;
  due_date: string | null;
}

interface ExistingActiveTask {
  id: string;
  title: string;
  description: string | null;
  impact_score: number;
  priority_score: number;
  normalized_title: string | null;
  task_category: string | null;
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
): Pick<TaskCandidate, "goal_id" | "goal_progress_amount"> {
  const match = matchTaskToGoal(title, description, goals, debtTitles);
  return {
    goal_id: match.goalId,
    goal_progress_amount: match.progressAmount,
  };
}

function buildCandidate(
  base: Omit<
    TaskCandidate,
    "normalized_title" | "task_category"
  >
): TaskCandidate {
  return {
    ...base,
    normalized_title: normalizeTaskTitle(base.title),
    task_category: detectTaskCategory(base.title, base.description),
  };
}

function mapNextBestAction(
  action: NextBestAction,
  userId: string,
  analysisId: string,
  goals: FinancialGoal[],
  debtTitles: string[]
): TaskCandidate {
  const title = action.title.trim();
  const description = action.description?.trim() ?? null;
  const goalLink = attachGoal(title, description, goals, debtTitles);

  return buildCandidate({
    user_id: userId,
    analysis_id: analysisId,
    ...goalLink,
    title,
    description,
    impact_score: Math.min(100, Math.max(1, action.impact_score ?? 80)),
    impact_label: action.impact_label ?? BENEFIT_LABELS.high,
    due_date: dueDateFromDays(action.due_days ?? 7),
  });
}

function mapAction30Day(
  action: AiAction30Day,
  userId: string,
  analysisId: string,
  goals: FinancialGoal[],
  debtTitles: string[]
): TaskCandidate {
  const priority = action.priority ?? "medium";
  const title = action.action.trim();
  const description = action.effect?.trim() ?? null;
  const goalLink = attachGoal(title, description, goals, debtTitles);

  return buildCandidate({
    user_id: userId,
    analysis_id: analysisId,
    ...goalLink,
    title,
    description,
    impact_score: PRIORITY_SCORE[priority] ?? 50,
    impact_label: PRIORITY_LABEL[priority] ?? BENEFIT_LABELS.medium,
    due_date: dueDateFromDays(30),
  });
}

function consolidateByCategory(candidates: TaskCandidate[]): TaskCandidate[] {
  const byCategory = new Map<TaskCategory, TaskCandidate>();

  for (const candidate of candidates) {
    const existing = byCategory.get(candidate.task_category);
    byCategory.set(
      candidate.task_category,
      existing ? pickBetterTask(candidate, existing) : candidate
    );
  }

  return Array.from(byCategory.values()).sort(
    (a, b) => b.impact_score - a.impact_score
  );
}

function shouldUpdateExisting(
  candidate: TaskCandidate,
  existing: ExistingActiveTask
): boolean {
  if (candidate.impact_score > existing.impact_score) return true;
  if (candidate.impact_score < existing.impact_score) return false;
  return isMoreSpecificTask(candidate, existing);
}

export async function createTasksFromAnalysis(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string,
  parsed: AiAnalysisResult
): Promise<CreateTasksFromAnalysisResult> {
  const emptyResult: CreateTasksFromAnalysisResult = {
    created_tasks_count: 0,
    updated_tasks_count: 0,
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
      .select(
        "id, title, description, impact_score, priority_score, normalized_title, task_category"
      )
      .eq("user_id", userId)
      .in("status", ["pending", "postponed"]),
    supabase.from("financial_goals").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase.from("incomes").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
  ]);

  const userGoals = (goals ?? []) as FinancialGoal[];
  const debtTitles = (debts ?? []).map((d) => d.title);
  const financeOptions = {
    incomes: (incomes ?? []) as Income[],
    expenses: (expenses ?? []) as Expense[],
    debts: (debts ?? []) as Debt[],
    goals: userGoals,
  };

  const existingByCategory = new Map<TaskCategory, ExistingActiveTask>();
  const existingNormalized = new Set<string>();

  for (const row of activeTasks ?? []) {
    const task = row as ExistingActiveTask;
    const category = (task.task_category ??
      detectTaskCategory(task.title, task.description)) as TaskCategory;
    const normalized =
      task.normalized_title ?? normalizeTaskTitle(task.title ?? "");

    if (normalized) existingNormalized.add(normalized);

    const current = existingByCategory.get(category);
    if (!current || task.impact_score > current.impact_score) {
      existingByCategory.set(category, { ...task, task_category: category });
    }
  }

  const rawCandidates: TaskCandidate[] = [];

  if (parsed.next_best_action?.title) {
    rawCandidates.push(
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
    if (!action.action?.trim()) continue;
    rawCandidates.push(
      mapAction30Day(action, userId, analysisId, userGoals, debtTitles)
    );
  }

  const consolidated = consolidateByCategory(rawCandidates).slice(
    0,
    MAX_TASKS_PER_ANALYSIS
  );

  const toInsert: TaskCandidate[] = [];
  const toUpdate: Array<{ id: string; candidate: TaskCandidate }> = [];
  let skippedDuplicateTasksCount = 0;

  for (const candidate of consolidated) {
    const existing = existingByCategory.get(candidate.task_category);

    if (existing) {
      if (shouldUpdateExisting(candidate, existing)) {
        toUpdate.push({ id: existing.id, candidate });
      } else {
        skippedDuplicateTasksCount += 1;
      }
      continue;
    }

    if (
      candidate.normalized_title &&
      existingNormalized.has(candidate.normalized_title)
    ) {
      skippedDuplicateTasksCount += 1;
      continue;
    }

    toInsert.push(candidate);
    existingNormalized.add(candidate.normalized_title);
    existingByCategory.set(candidate.task_category, {
      id: "pending-insert",
      title: candidate.title,
      description: candidate.description,
      impact_score: candidate.impact_score,
      priority_score: 0,
      normalized_title: candidate.normalized_title,
      task_category: candidate.task_category,
    });
  }

  const profileType = await getProfileTypeForUser(supabase, userId);
  const summary = computeDashboardSummary(
    financeOptions.incomes,
    financeOptions.expenses,
    financeOptions.debts,
    profileType
  );
  const priorityOptions = { hasNegativeCashflow: summary.netCashFlow < 0, profileType };

  const updatedTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    impact_score: number;
    goal_id: string | null;
    goal_progress_amount: number | null;
  }> = [];

  for (const { id, candidate } of toUpdate) {
    const { priority_score, financial_impact } = calculateTaskPriority(
      {
        title: candidate.title,
        description: candidate.description,
        impact_score: candidate.impact_score,
        impact_label: candidate.impact_label,
        due_date: candidate.due_date,
        goal_id: candidate.goal_id,
        goal_type:
          userGoals.find((goal) => goal.id === candidate.goal_id)?.type ?? null,
      },
      { ...priorityOptions, profileType }
    );

    const { error } = await supabase
      .from("financial_tasks")
      .update({
        analysis_id: candidate.analysis_id,
        title: candidate.title,
        normalized_title: candidate.normalized_title,
        task_category: candidate.task_category,
        description: candidate.description,
        impact_score: candidate.impact_score,
        impact_label: candidate.impact_label,
        due_date: candidate.due_date,
        goal_id: candidate.goal_id,
        goal_progress_amount: candidate.goal_progress_amount,
        priority_score,
        financial_impact,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update financial task:", error);
      skippedDuplicateTasksCount += 1;
      continue;
    }

    updatedTasks.push({
      id,
      title: candidate.title,
      description: candidate.description,
      impact_score: candidate.impact_score,
      goal_id: candidate.goal_id,
      goal_progress_amount: candidate.goal_progress_amount,
    });
  }

  if (updatedTasks.length > 0) {
    await refreshTaskImpacts(supabase, userId, updatedTasks, financeOptions);
  }

  let createdTasksCount = 0;

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from("financial_tasks")
      .insert(toInsert)
      .select(
        "id, title, description, impact_score, goal_id, goal_progress_amount"
      );

    if (error) {
      console.error("Failed to create financial tasks:", error);
    } else {
      createdTasksCount = inserted?.length ?? 0;
      await createTaskImpacts(supabase, userId, inserted ?? [], financeOptions);
    }
  }

  if (createdTasksCount > 0 || updatedTasks.length > 0) {
    await syncPendingTaskPriorities(supabase, userId, {
      ...priorityOptions,
      profileType,
    });
  }

  try {
    await deduplicateUserTasksForUser(supabase, userId);
  } catch (error) {
    console.error("Failed to deduplicate user tasks:", error);
  }

  return {
    created_tasks_count: createdTasksCount,
    updated_tasks_count: updatedTasks.length,
    skipped_duplicate_tasks_count: skippedDuplicateTasksCount,
  };
}
