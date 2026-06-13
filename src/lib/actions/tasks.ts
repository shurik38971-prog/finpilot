"use server";

import {
  getActiveEscapePlanId,
  repairArchivedEscapeRouteStepsForActivePlan,
  syncActiveEscapeRouteSteps,
} from "@/lib/actions/escape-plans";
import { sortEscapeRouteTasks } from "@/lib/escape-plan/route-steps";
import { getProfileTypeForUser } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { syncPendingTaskPriorities } from "@/lib/ai/sync-task-priorities";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackServerEvent } from "@/lib/analytics/track-server";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { getDisplayableTaskImpact } from "@/lib/finance/task-effect-eligibility";
import { applyGoalProgressOnTaskComplete } from "@/lib/finance/goal-progress";
import { pickPrimaryGoal } from "@/lib/finance/match-task-to-goal";
import {
  buildTaskMotivation,
  calculateTaskPriority,
} from "@/lib/services/task-priority";
import { revalidatePath } from "next/cache";
import type { FinancialGoal } from "@/types/goals";
import type { TaskImpact } from "@/types/task-impact";
import type {
  FinancialTask,
  FinancialTaskWithGoal,
  NextBestActionResult,
  PrimaryGoalFocus,
} from "@/types/tasks";

const TASK_PATHS = ["/actions", "/dashboard", "/analyze", "/goals", "/simulator", "/escape-plan"] as const;

const TASK_SELECT = `
  *,
  goal:financial_goals(id, title, type, target_amount, current_amount),
  impact:task_impacts(*)
`;

function revalidateTaskPages() {
  for (const path of TASK_PATHS) {
    revalidatePath(path);
  }
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function normalizeImpact(
  raw: TaskImpact | TaskImpact[] | null | undefined
): TaskImpact | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw;
}

function mapTask(row: Record<string, unknown>): FinancialTaskWithGoal {
  const goal = row.goal as FinancialTaskWithGoal["goal"];
  const impact = normalizeImpact(
    row.impact as TaskImpact | TaskImpact[] | null | undefined
  );
  const { goal: _goal, impact: _impact, ...rest } = row;
  void _goal;
  void _impact;
  const task = rest as unknown as FinancialTask;
  return { ...task, goal: goal ?? null, impact };
}

async function assertCurrentEscapeRouteStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  task: Pick<FinancialTask, "id" | "escape_plan_id" | "status">
) {
  if (!task.escape_plan_id || task.status !== "pending") return;

  const { data, error } = await supabase
    .from("financial_tasks")
    .select("id, order_index, normalized_title, status")
    .eq("user_id", userId)
    .eq("escape_plan_id", task.escape_plan_id)
    .eq("status", "pending");

  if (error) throw error;

  const current = sortEscapeRouteTasks((data ?? []) as FinancialTask[])[0];
  if (current && current.id !== task.id) {
    throw new Error("Сначала выполните текущий шаг маршрута");
  }
}

export async function getFinancialTasks(options?: {
  activeEscapePlanOnly?: boolean;
}): Promise<FinancialTaskWithGoal[]> {
  if (options?.activeEscapePlanOnly) {
    await repairArchivedEscapeRouteStepsForActivePlan();
    await syncActiveEscapeRouteSteps();
  }

  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("financial_tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("priority_score", { ascending: false })
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  let tasks = (data ?? [])
    .map((row) => mapTask(row as Record<string, unknown>))
    .filter((task) => Boolean(task.explanation?.trim()));

  if (options?.activeEscapePlanOnly) {
    const activePlanId = await getActiveEscapePlanId();
    if (!activePlanId) return [];
    tasks = tasks.filter((task) => task.escape_plan_id === activePlanId);
    tasks = sortEscapeRouteTasks(tasks);
  }

  return tasks;
}

export async function getFinancialMeasureTasks(): Promise<FinancialTaskWithGoal[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("financial_tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .neq("status", "archived")
    .is("escape_plan_id", null)
    .like("normalized_title", "measure:%")
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .map((row) => mapTask(row as Record<string, unknown>))
    .filter((task) => Boolean(task.explanation?.trim()));
}

export async function getCleanupActions(
  limit = 3
): Promise<FinancialTaskWithGoal[]> {
  const tasks = await getFinancialTasks({ activeEscapePlanOnly: true });
  const seen = new Set<string>();
  const result: FinancialTaskWithGoal[] = [];

  for (const task of tasks) {
    if (task.status !== "pending") continue;
    if (!task.explanation?.trim()) continue;

    const key = task.normalized_title?.trim() || task.title.trim();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(task);
    if (result.length >= limit) break;
  }

  return result;
}

export async function getTopPendingTask(): Promise<FinancialTaskWithGoal | null> {
  const next = await getNextBestAction();
  if (!next) return null;

  const tasks = await getFinancialTasks();
  return tasks.find((t) => t.id === next.id) ?? null;
}

function toNextBestActionResult(
  task: FinancialTaskWithGoal,
  options?: { hasNegativeCashflow?: boolean; profileType?: import("@/types/profile").ProfileType }
): NextBestActionResult {
  const { reasons } = calculateTaskPriority(
    {
      title: task.title,
      description: task.description,
      impact_score: task.impact_score,
      impact_label: task.impact_label,
      due_date: task.due_date,
      goal_id: task.goal_id,
      goal_type: task.goal?.type ?? null,
    },
    {
      hasNegativeCashflow: options?.hasNegativeCashflow,
      impact: task.impact,
      profileType: options?.profileType,
    }
  );

  const displayImpact = getDisplayableTaskImpact(task);

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    explanation: task.explanation ?? null,
    task_category: task.task_category,
    impact_score: task.impact_score,
    priority_score: task.priority_score,
    financial_impact: task.financial_impact,
    due_date: task.due_date,
    goal: task.goal,
    impact: displayImpact,
    reasons,
    motivation: buildTaskMotivation(displayImpact),
  };
}

export interface TaskProgressStats {
  completed: number;
  total: number;
  percent: number;
}

export async function getTaskProgressStats(): Promise<TaskProgressStats> {
  const tasks = await getFinancialTasks();
  const total = tasks.filter(
    (t) =>
      t.status === "pending" ||
      t.status === "done" ||
      t.status === "postponed"
  ).length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
}

export async function getNextBestAction(
  options?: { hasNegativeCashflow?: boolean }
): Promise<NextBestActionResult | null> {
  const { supabase, userId } = await getUserId();
  const profileType = await getProfileTypeForUser(supabase, userId);

  await syncPendingTaskPriorities(supabase, userId, { ...options, profileType });

  const { data, error } = await supabase
    .from("financial_tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("priority_score", { ascending: false })
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const task = (data ?? [])
    .map((row) => mapTask(row as Record<string, unknown>))
    .find((row) => Boolean(row.explanation?.trim()));

  if (!task) return null;

  return toNextBestActionResult(task, { ...options, profileType });
}

export async function getTasksByGoalId(
  goalId: string
): Promise<FinancialTaskWithGoal[]> {
  const tasks = await getFinancialTasks();
  return tasks.filter((t) => t.goal_id === goalId);
}

export async function getPrimaryGoalFocus(): Promise<PrimaryGoalFocus | null> {
  const { supabase, userId } = await getUserId();

  const { data: goals, error } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  const primary = pickPrimaryGoal((goals ?? []) as FinancialGoal[]);
  if (!primary) return null;

  const remaining = Math.max(0, primary.target_amount - primary.current_amount);
  const progressPercent =
    primary.target_amount > 0
      ? Math.round((primary.current_amount / primary.target_amount) * 100)
      : 0;

  const { data: taskRow } = await supabase
    .from("financial_tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("goal_id", primary.id)
    .order("priority_score", { ascending: false })
    .order("impact_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let task = taskRow ? mapTask(taskRow as Record<string, unknown>) : null;

  if (!task) {
    const { data: fallbackTask } = await supabase
      .from("financial_tasks")
      .select(TASK_SELECT)
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("priority_score", { ascending: false })
      .order("impact_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    task = fallbackTask
      ? mapTask(fallbackTask as Record<string, unknown>)
      : null;
  }

  return {
    goal: {
      id: primary.id,
      title: primary.title,
      type: primary.type,
      target_amount: primary.target_amount,
      current_amount: primary.current_amount,
    },
    task,
    remaining,
    progressPercent,
    taskImpact: task ? getDisplayableTaskImpact(task) : null,
  };
}

export async function completeTask(
  id: string,
  options?: { hasNegativeCashflow?: boolean }
): Promise<{
  nextAction: NextBestActionResult | null;
  taskProgress: TaskProgressStats;
  askRecommendationFeedback: boolean;
}> {
  const { supabase, userId } = await getUserId();

  const { data: taskRow, error: fetchError } = await supabase
    .from("financial_tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const task = mapTask(taskRow as Record<string, unknown>);

  await assertCurrentEscapeRouteStep(supabase, userId, task);

  const { error } = await supabase
    .from("financial_tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;

  if (task.goal_id) {
    const { data: fullGoal } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("id", task.goal_id)
      .eq("user_id", userId)
      .single();

    if (fullGoal) {
      await applyGoalProgressOnTaskComplete(
        supabase,
        task,
        fullGoal as FinancialGoal
      );
    }
  }

  const profileType = await getProfileTypeForUser(supabase, userId);
  if (!task.escape_plan_id) {
    await syncPendingTaskPriorities(supabase, userId, {
      ...options,
      profileType,
    });
  }
  await trackServerEvent({
    event_name: ANALYTICS_EVENTS.TASK_COMPLETED,
    user_id: userId,
    page_path: "/actions",
    element_id: id,
    properties: { title: task.title },
  });
  await trackProductEvent(
    PRODUCT_EVENTS.TASK_COMPLETED,
    { task_id: id, title: task.title },
    userId
  );
  revalidateTaskPages();

  const [nextAction, taskProgress] = await Promise.all([
    getNextBestAction(options),
    getTaskProgressStats(),
  ]);

  return {
    nextAction,
    taskProgress,
    askRecommendationFeedback: !task.escape_plan_id,
  };
}

export async function postponeTask(id: string) {
  const { supabase, userId } = await getUserId();

  const { data: taskRow, error: fetchError } = await supabase
    .from("financial_tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const task = taskRow as FinancialTask;
  await assertCurrentEscapeRouteStep(supabase, userId, task);

  const { error } = await supabase
    .from("financial_tasks")
    .update({ status: "postponed" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  revalidateTaskPages();
}

export async function deleteTask(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("financial_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  revalidateTaskPages();
}
