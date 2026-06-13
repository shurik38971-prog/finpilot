"use server";

import { buildActiveGoalTitle } from "@/lib/escape-plan/build-active-goal";
import { buildFinancialMeasureTaskRow, filterFinancialMeasureOptions } from "@/lib/escape-plan/financial-measures";
import { isIncomeRouteOption, measureTaskKey } from "@/lib/escape-plan/recommendation-types";
import { buildEscapeRouteSteps, sortEscapeRouteTasks } from "@/lib/escape-plan/route-steps";
import {
  needsRouteStepOrderRepair,
  pickRouteStepAssignments,
} from "@/lib/escape-plan/repair-route-step-order";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  EscapeFollowUpAnswer,
  EscapePlanOption,
  EscapePlanOptionType,
  UserEscapePlan,
} from "@/types/escape-plan";
import type { EscapeFailureReason } from "@/types/rescue-plan";
import { isActiveEscapeAttempt, resolveAttemptStatus } from "@/types/rescue-plan";
import type { FinancialTask, TaskCategory } from "@/types/tasks";

const ESCAPE_PATHS = ["/escape-plan", "/dashboard", "/actions"];

const OPTION_TASK_CATEGORY: Record<EscapePlanOptionType, TaskCategory> = {
  increase_income: "increase_income",
  reduce_expenses: "cut_optional_spending",
  debt_action: "debt_negotiation",
};

function normalizeEscapePlan(row: UserEscapePlan): UserEscapePlan {
  return {
    ...row,
    attempt_status: resolveAttemptStatus(row),
    failure_reason: row.failure_reason ?? null,
    failure_reason_other: row.failure_reason_other ?? null,
    active_goal: row.active_goal ?? null,
    income_found: row.income_found ?? 0,
  };
}

function estimateIncomeFromOption(option: EscapePlanOption): number {
  if (option.income_min > 0 && option.income_max > 0) {
    return Math.round((option.income_min + option.income_max) / 2);
  }
  if (option.income_min > 0) return option.income_min;
  if (option.expected_effect && option.expected_effect > 0) {
    return option.expected_effect;
  }
  return 0;
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function revalidateEscapePages() {
  for (const path of ESCAPE_PATHS) {
    revalidatePath(path);
  }
}

async function archiveEscapePlanTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string
) {
  const { error } = await supabase
    .from("financial_tasks")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived");

  if (error) throw error;
}

/** All non-archived escape-route tasks for the user (any status). */
async function archiveAllEscapeRouteTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exceptPlanId?: string
) {
  let query = supabase
    .from("financial_tasks")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .neq("status", "archived")
    .not("escape_plan_id", "is", null);

  if (exceptPlanId) {
    query = query.neq("escape_plan_id", exceptPlanId);
  }

  const { error } = await query;
  if (error) throw error;
}

/** Analysis orphan tasks without escape_plan_id (not financial measures). */
async function archiveOrphanActionTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { error } = await supabase
    .from("financial_tasks")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .neq("status", "archived")
    .is("escape_plan_id", null)
    .not("normalized_title", "like", "measure:%");

  if (error) throw error;
}

async function archiveActiveEscapePlans(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { error } = await supabase
    .from("user_escape_plans")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;
}

export async function getActiveEscapePlan(): Promise<UserEscapePlan | null> {
  const plans = await getUserEscapePlans();
  return plans.find((plan) => isActiveEscapeAttempt(plan)) ?? null;
}

export async function getActiveEscapePlanId(): Promise<string | null> {
  const active = await getActiveEscapePlan();
  return active?.id ?? null;
}

/** Restore route steps wrongly archived by category deduplication. */
export async function repairArchivedEscapeRouteStepsForActivePlan(): Promise<void> {
  const activePlanId = await getActiveEscapePlanId();
  if (!activePlanId) return;
  const { supabase, userId } = await getUserId();
  await repairArchivedEscapeRouteSteps(supabase, userId, activePlanId);
  await repairEscapeRouteStepOrderForPlan(supabase, userId, activePlanId);
}

export async function repairEscapeRouteStepOrderForActivePlan(): Promise<void> {
  const activePlanId = await getActiveEscapePlanId();
  if (!activePlanId) return;
  const { supabase, userId } = await getUserId();
  await repairEscapeRouteStepOrderForPlan(supabase, userId, activePlanId);
}

async function repairEscapeRouteStepOrderForPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string
) {
  const { data: plan, error: planError } = await supabase
    .from("user_escape_plans")
    .select("option_snapshot")
    .eq("id", escapePlanId)
    .eq("user_id", userId)
    .single();

  if (planError) throw planError;
  await ensureEscapeRouteStepsForPlan(
    supabase,
    userId,
    escapePlanId,
    plan.option_snapshot as EscapePlanOption
  );
}

async function repairArchivedEscapeRouteSteps(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string
) {
  const { count: pendingCount, error: pendingError } = await supabase
    .from("financial_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .in("status", ["pending", "postponed"]);

  if (pendingError) throw pendingError;
  if ((pendingCount ?? 0) > 0) return;

  const { count: doneCount, error: doneError } = await supabase
    .from("financial_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .eq("status", "done");

  if (doneError) throw doneError;
  if ((doneCount ?? 0) === 0) return;

  const { count: archivedCount, error: archivedError } = await supabase
    .from("financial_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .eq("status", "archived");

  if (archivedError) throw archivedError;
  if ((archivedCount ?? 0) === 0) return;

  const { error } = await supabase
    .from("financial_tasks")
    .update({ status: "pending" })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .eq("status", "archived");

  if (error) throw error;
}

/** Before a new AI run or full reset — archive route tasks and abandon active plans. */
export async function abandonActiveEscapeRoute(): Promise<void> {
  const { supabase, userId } = await getUserId();
  await archiveAllEscapeRouteTasks(supabase, userId);
  await archiveOrphanActionTasks(supabase, userId);
  await archiveActiveEscapePlans(supabase, userId);
  revalidateEscapePages();
  revalidatePath("/actions");
  revalidatePath("/dashboard");
}

async function createEscapePlanTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string,
  option: EscapePlanOption
) {
  if (!isIncomeRouteOption(option)) {
    throw new Error("Пошаговый план доступен только для маршрутов доп.дохода");
  }

  const steps = buildEscapeRouteSteps(option);
  const category = OPTION_TASK_CATEGORY[option.type] ?? "other";

  const rows = steps.map((routeStep, index) => ({
    user_id: userId,
    title: routeStep.title,
    description: routeStep.description,
    explanation: routeStep.why_important,
    impact_score: Math.max(40, 70 - index * 8),
    impact_label: "Заметно поможет",
    priority_score: 1000 - index,
    financial_impact: 0,
    task_category: category,
    escape_plan_id: escapePlanId,
    order_index: index + 1,
    normalized_title: `escape:${escapePlanId}:${index}`,
    status: "pending" as const,
  }));

  const { error } = await supabase.from("financial_tasks").insert(rows);
  if (error) throw error;
}

async function repairEscapeRouteStepOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string,
  option: EscapePlanOption
) {
  const { data: tasks, error } = await supabase
    .from("financial_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived");

  if (error) throw error;

  const active = (tasks ?? []) as FinancialTask[];
  if (!needsRouteStepOrderRepair(active, option)) return;

  const canonical = buildEscapeRouteSteps(option);
  const assignments = pickRouteStepAssignments(active, option);
  const category = OPTION_TASK_CATEGORY[option.type] ?? "other";
  const used = new Set(assignments.keys());

  const toArchive = active.filter((task) => !used.has(task.id)).map((task) => task.id);
  if (toArchive.length > 0) {
    const { error: archiveError } = await supabase
      .from("financial_tasks")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .in("id", toArchive);
    if (archiveError) throw archiveError;
  }

  for (const [taskId, orderIndex] of assignments) {
    const routeStep = canonical[orderIndex - 1];
    if (!routeStep) continue;

    const { error: updateError } = await supabase
      .from("financial_tasks")
      .update({
        order_index: orderIndex,
        title: routeStep.title,
        description: routeStep.description,
        explanation: routeStep.why_important,
        normalized_title: `escape:${escapePlanId}:${orderIndex - 1}`,
        priority_score: 1000 - (orderIndex - 1),
      })
      .eq("id", taskId)
      .eq("user_id", userId);

    if (updateError) throw updateError;
  }

  const assignedOrders = new Set(assignments.values());
  const missingRows = canonical
    .map((routeStep, index) => ({ routeStep, orderIndex: index + 1 }))
    .filter(({ orderIndex }) => !assignedOrders.has(orderIndex))
    .map(({ routeStep, orderIndex }) => {
      const index = orderIndex - 1;
      return {
        user_id: userId,
        title: routeStep.title,
        description: routeStep.description,
        explanation: routeStep.why_important,
        impact_score: Math.max(40, 70 - index * 8),
        impact_label: "Заметно поможет",
        priority_score: 1000 - index,
        financial_impact: 0,
        task_category: category,
        escape_plan_id: escapePlanId,
        order_index: orderIndex,
        normalized_title: `escape:${escapePlanId}:${index}`,
        status: "pending" as const,
      };
    });

  if (missingRows.length > 0) {
    const { error: insertError } = await supabase
      .from("financial_tasks")
      .insert(missingRows);
    if (insertError) throw insertError;
  }
}

async function ensureEscapeRouteStepsForPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string,
  option: EscapePlanOption
) {
  if (!isIncomeRouteOption(option)) return;

  const { count, error } = await supabase
    .from("financial_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived");

  if (error) throw error;
  if ((count ?? 0) === 0) {
    await createEscapePlanTasks(supabase, userId, escapePlanId, option);
    return;
  }

  await repairEscapeRouteStepOrder(supabase, userId, escapePlanId, option);
}

/** Create missing route steps for the active plan (safe during RSC render). */
export async function syncActiveEscapeRouteSteps(): Promise<UserEscapePlan | null> {
  const active = await getActiveEscapePlan();
  if (!active) return null;

  const { supabase, userId } = await getUserId();
  await ensureEscapeRouteStepsForPlan(
    supabase,
    userId,
    active.id,
    active.option_snapshot as EscapePlanOption
  );
  return active;
}

/** Server action: sync route steps and invalidate cached pages. */
export async function ensureActiveEscapeRouteSteps(): Promise<UserEscapePlan | null> {
  const active = await syncActiveEscapeRouteSteps();
  if (active) {
    revalidateEscapePages();
    revalidatePath("/actions");
  }
  return active;
}

export async function activatePrimaryIncomeRouteAfterAnalysis(
  plan: EscapePlanOption[]
): Promise<UserEscapePlan | null> {
  const active = await getActiveEscapePlan();
  if (active) {
    await syncActiveEscapeRouteSteps();
    return active;
  }

  const primaryIncome =
    plan.find((option) => isIncomeRouteOption(option)) ?? null;
  if (!primaryIncome) return null;

  return chooseEscapeOption(primaryIncome);
}

async function findExistingRouteByTitle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  optionTitle: string,
  statuses: string[]
) {
  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("option_title", optionTitle)
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeEscapePlan(data as UserEscapePlan) : null;
}

async function createActiveEscapePlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  const followUpDue = new Date();
  followUpDue.setDate(followUpDue.getDate() + 7);

  const { data, error } = await supabase
    .from("user_escape_plans")
    .insert({
      user_id: userId,
      option_title: option.title,
      option_snapshot: option,
      status: "active",
      attempt_status: "in_progress",
      active_goal: buildActiveGoalTitle(option),
      income_found: 0,
      follow_up_due_at: followUpDue.toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;

  await createEscapePlanTasks(supabase, userId, data.id, option);
  return normalizeEscapePlan(data as UserEscapePlan);
}

async function promotePlanToActive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  planId: string,
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  const followUpDue = new Date();
  followUpDue.setDate(followUpDue.getDate() + 7);

  await archiveEscapePlanTasks(supabase, userId, planId);

  const { data, error } = await supabase
    .from("user_escape_plans")
    .update({
      status: "active",
      attempt_status: "in_progress",
      option_snapshot: option,
      active_goal: buildActiveGoalTitle(option),
      income_found: 0,
      follow_up_due_at: followUpDue.toISOString(),
      follow_up_answer: null,
      follow_up_answered_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  await createEscapePlanTasks(supabase, userId, planId, option);
  return normalizeEscapePlan(data as UserEscapePlan);
}

async function switchToEscapeOption(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  const active = await getActiveEscapePlan();
  if (active) {
    await archiveEscapePlanTasks(supabase, userId, active.id);
    const { error: archiveError } = await supabase
      .from("user_escape_plans")
      .update({
        status: "alternative",
        updated_at: new Date().toISOString(),
      })
      .eq("id", active.id)
      .eq("user_id", userId);
    if (archiveError) throw archiveError;
  }

  await archiveOrphanActionTasks(supabase, userId);

  const existing = await findExistingRouteByTitle(supabase, userId, option.title, [
    "alternative",
    "archived",
    "abandoned",
  ]);

  if (existing) {
    return promotePlanToActive(supabase, userId, existing.id, option);
  }

  return createActiveEscapePlan(supabase, userId, option);
}

export async function getUserEscapePlans(): Promise<UserEscapePlan[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as UserEscapePlan[]).map(normalizeEscapePlan);
}

export async function getFailedEscapeAttempts(): Promise<UserEscapePlan[]> {
  const plans = await getUserEscapePlans();
  return plans.filter(
    (plan) =>
      resolveAttemptStatus(plan) === "failed" && Boolean(plan.failure_reason)
  );
}

export async function getEscapePlanTasks(
  escapePlanId: string
): Promise<FinancialTask[]> {
  const { supabase, userId } = await getUserId();

  const { data: plan, error: planError } = await supabase
    .from("user_escape_plans")
    .select("option_snapshot")
    .eq("id", escapePlanId)
    .eq("user_id", userId)
    .single();

  if (planError) throw planError;

  const option = plan.option_snapshot as EscapePlanOption;
  await repairArchivedEscapeRouteSteps(supabase, userId, escapePlanId);
  await ensureEscapeRouteStepsForPlan(supabase, userId, escapePlanId, option);

  const { data, error } = await supabase
    .from("financial_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived")
    .order("order_index", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return sortEscapeRouteTasks((data ?? []) as FinancialTask[]);
}

export async function getPendingEscapeFollowUp(): Promise<UserEscapePlan | null> {
  const { supabase, userId } = await getUserId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("follow_up_answer", null)
    .lte("follow_up_due_at", now)
    .order("follow_up_due_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeEscapePlan(data as UserEscapePlan) : null;
}

function assertIncomeRouteOption(option: EscapePlanOption) {
  if (!isIncomeRouteOption(option)) {
    throw new Error("Этот вариант — финансовая мера, а не маршрут доп.дохода");
  }
}

export async function syncFinancialMeasureTasks(
  options: EscapePlanOption[]
): Promise<void> {
  const measures = filterFinancialMeasureOptions(options);
  if (measures.length === 0) return;

  const { supabase, userId } = await getUserId();

  for (const option of measures) {
    const key = measureTaskKey(option.title);
    const { data: existing, error: fetchError } = await supabase
      .from("financial_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("normalized_title", key)
      .neq("status", "archived")
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) continue;

    const { error } = await supabase
      .from("financial_tasks")
      .insert(buildFinancialMeasureTaskRow(userId, option));

    if (error) throw error;
  }

  revalidateEscapePages();
  revalidatePath("/actions");
}

export async function chooseEscapeOption(
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  assertIncomeRouteOption(option);
  const { supabase, userId } = await getUserId();
  const active = await getActiveEscapePlan();
  const saved = active
    ? await switchToEscapeOption(supabase, userId, option)
    : await createActiveEscapePlan(supabase, userId, option);

  revalidateEscapePages();
  revalidatePath("/actions");
  return saved;
}

export async function saveEscapeOptionAsAlternative(
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  assertIncomeRouteOption(option);
  const { supabase, userId } = await getUserId();

  const existing = await findExistingRouteByTitle(supabase, userId, option.title, [
    "alternative",
  ]);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("user_escape_plans")
    .insert({
      user_id: userId,
      option_title: option.title,
      option_snapshot: option,
      status: "alternative",
      attempt_status: "not_started",
      active_goal: buildActiveGoalTitle(option),
      income_found: 0,
      follow_up_due_at: null,
    })
    .select("*")
    .single();

  if (error) throw error;

  revalidateEscapePages();
  return normalizeEscapePlan(data as UserEscapePlan);
}

export async function activateEscapeOption(
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  assertIncomeRouteOption(option);
  const { supabase, userId } = await getUserId();
  const saved = await switchToEscapeOption(supabase, userId, option);

  revalidateEscapePages();
  revalidatePath("/actions");
  return saved;
}

export async function activateSavedEscapeRoute(
  planId: string
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  const { data: plan, error: fetchError } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;
  if (!plan) throw new Error("Маршрут не найден");

  const snapshot = plan.option_snapshot as EscapePlanOption;
  const saved = await switchToEscapeOption(supabase, userId, snapshot);

  revalidateEscapePages();
  revalidatePath("/actions");
  return saved;
}

export async function answerEscapeFollowUp(
  selectionId: string,
  answer: EscapeFollowUpAnswer
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  if (answer === "no") {
    const { data, error } = await supabase
      .from("user_escape_plans")
      .update({
        follow_up_answer: answer,
        follow_up_answered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    revalidateEscapePages();
    return normalizeEscapePlan(data as UserEscapePlan);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("user_escape_plans")
    .select("option_snapshot")
    .eq("id", selectionId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const snapshot = existing.option_snapshot as EscapePlanOption;
  const status = answer === "yes" ? "completed" : "active";
  const attemptStatus = answer === "yes" ? "success" : "in_progress";
  const incomeFound =
    answer === "yes" ? estimateIncomeFromOption(snapshot) : undefined;

  const { data, error } = await supabase
    .from("user_escape_plans")
    .update({
      follow_up_answer: answer,
      follow_up_answered_at: new Date().toISOString(),
      status,
      attempt_status: attemptStatus,
      ...(incomeFound !== undefined ? { income_found: incomeFound } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  revalidateEscapePages();
  return normalizeEscapePlan(data as UserEscapePlan);
}

export async function reportAttemptFailure(
  selectionId: string,
  reason: EscapeFailureReason,
  reasonOther?: string
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from("user_escape_plans")
    .update({
      status: "archived",
      attempt_status: "failed",
      failure_reason: reason,
      failure_reason_other:
        reason === "other" ? reasonOther?.trim() || null : null,
      follow_up_answer: "no",
      follow_up_answered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;

  await archiveAllEscapeRouteTasks(supabase, userId);
  await archiveOrphanActionTasks(supabase, userId);
  revalidateEscapePages();
  revalidatePath("/actions");
  return normalizeEscapePlan(data as UserEscapePlan);
}
