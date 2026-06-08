"use server";

import { buildActiveGoalTitle } from "@/lib/escape-plan/build-active-goal";
import { buildEscapeActionSteps } from "@/lib/escape-plan/build-action-steps";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  EscapeFollowUpAnswer,
  EscapePlanOption,
  EscapePlanOptionType,
  UserEscapePlan,
} from "@/types/escape-plan";
import type { EscapeFailureReason } from "@/types/rescue-plan";
import { resolveAttemptStatus } from "@/types/rescue-plan";
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

async function archivePendingEscapeTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  await supabase
    .from("financial_tasks")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("status", "pending")
    .not("escape_plan_id", "is", null);
}

async function createEscapePlanTasks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  escapePlanId: string,
  option: EscapePlanOption,
  plan7Days: string[]
) {
  const steps = buildEscapeActionSteps(option, plan7Days);
  const category = OPTION_TASK_CATEGORY[option.type] ?? "other";

  const rows = steps.map((title, index) => ({
    user_id: userId,
    title,
    description: `Шаг по направлению «${option.title}»`,
    explanation: `Вы выбрали это направление в «Поиске выхода». Выполните шаг — так вы приблизитесь к результату.`,
    impact_score: Math.max(40, 70 - index * 8),
    impact_label: "Заметно поможет",
    priority_score: Math.max(50, 95 - index * 10),
    financial_impact: 0,
    task_category: category,
    escape_plan_id: escapePlanId,
    normalized_title: `escape:${escapePlanId}:${index}`,
    status: "pending" as const,
  }));

  const { error } = await supabase.from("financial_tasks").insert(rows);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from("financial_tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived")
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FinancialTask[];
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

export async function chooseEscapeOption(
  option: EscapePlanOption,
  plan7Days: string[] = []
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  await archivePendingEscapeTasks(supabase, userId);

  await supabase
    .from("user_escape_plans")
    .update({
      status: "abandoned",
      attempt_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active");

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

  await createEscapePlanTasks(supabase, userId, data.id, option, plan7Days);

  revalidateEscapePages();
  return normalizeEscapePlan(data as UserEscapePlan);
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
      status: "abandoned",
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

  await archivePendingEscapeTasks(supabase, userId);
  revalidateEscapePages();
  return normalizeEscapePlan(data as UserEscapePlan);
}
