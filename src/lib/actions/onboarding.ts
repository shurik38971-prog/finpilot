"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OnboardingProgress, OnboardingStep } from "@/types/onboarding";
import type { SupabaseClient } from "@supabase/supabase-js";

const STEP_FIELD: Record<
  OnboardingStep,
  keyof Pick<
    OnboardingProgress,
    | "profile_done"
    | "income_done"
    | "expenses_done"
    | "debts_done"
    | "goal_done"
    | "analysis_done"
  >
> = {
  profile: "profile_done",
  income: "income_done",
  expenses: "expenses_done",
  debts: "debts_done",
  goal: "goal_done",
  analysis: "analysis_done",
};

function isAllStepsDone(row: Pick<
  OnboardingProgress,
  | "profile_done"
  | "income_done"
  | "expenses_done"
  | "debts_done"
  | "goal_done"
  | "analysis_done"
>) {
  return (
    row.profile_done &&
    row.income_done &&
    row.expenses_done &&
    row.debts_done &&
    row.goal_done &&
    row.analysis_done
  );
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

async function ensureOnboardingRow(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingProgress> {
  const { data: existing } = await supabase
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as OnboardingProgress;

  const { data: created, error } = await supabase
    .from("onboarding_progress")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return created as OnboardingProgress;
}

async function reconcileFromData(
  supabase: SupabaseClient,
  userId: string,
  row: OnboardingProgress
): Promise<OnboardingProgress> {
  const [profile, incomes, expenses, debts, goals, analyses] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        "profile_type, average_month_income, bad_month_income, good_month_income, income_average_monthly, income_bad_month, income_good_month"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("incomes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_profile_parameter", false),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("debts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("financial_goals").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("analyses").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const backfillFromData = row.completed;

  const next = {
    profile_done: row.profile_done || Boolean(profile.data?.profile_type),
    income_done:
      row.income_done ||
      (backfillFromData &&
        ((incomes.count ?? 0) > 0 ||
          ((profile.data?.bad_month_income ??
            profile.data?.income_bad_month ??
            0) > 0 &&
            (profile.data?.good_month_income ??
              profile.data?.income_good_month ??
              0) > 0))),
    expenses_done:
      row.expenses_done ||
      (backfillFromData && (expenses.count ?? 0) > 0),
    debts_done:
      row.debts_done || (backfillFromData && (debts.count ?? 0) > 0),
    goal_done:
      row.goal_done || (backfillFromData && (goals.count ?? 0) > 0),
    analysis_done:
      row.analysis_done ||
      (backfillFromData && (analyses.count ?? 0) > 0),
  };

  const completed = isAllStepsDone(next);
  const unchanged =
    next.profile_done === row.profile_done &&
    next.income_done === row.income_done &&
    next.expenses_done === row.expenses_done &&
    next.debts_done === row.debts_done &&
    next.goal_done === row.goal_done &&
    next.analysis_done === row.analysis_done &&
    completed === row.completed;

  if (unchanged) return row;

  const { data: updated, error } = await supabase
    .from("onboarding_progress")
    .update({
      ...next,
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return updated as OnboardingProgress;
}

export async function initOnboardingForNewUser(): Promise<void> {
  try {
    const { supabase, userId } = await getUserId();
    const { data: existing } = await supabase
      .from("onboarding_progress")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase.from("onboarding_progress").insert({
      user_id: userId,
      completed: false,
    });

    if (error) throw error;
  } catch (error) {
    console.error("initOnboardingForNewUser failed:", error);
  }
}

export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  try {
    const { supabase, userId } = await getUserId();
    const row = await ensureOnboardingRow(supabase, userId);
    return reconcileFromData(supabase, userId, row);
  } catch {
    return null;
  }
}

export async function markOnboardingStep(step: OnboardingStep): Promise<void> {
  try {
    const { supabase, userId } = await getUserId();
    const row = await ensureOnboardingRow(supabase, userId);
    const field = STEP_FIELD[step];

    if (row[field] && row.completed) return;

    const next = {
      ...row,
      [field]: true,
    };
    const completed = isAllStepsDone(next);

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        [field]: true,
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
  } catch (error) {
    console.error("markOnboardingStep failed:", step, error);
  }
}

export async function markOnboardingSteps(
  steps: OnboardingStep[]
): Promise<void> {
  for (const step of steps) {
    await markOnboardingStep(step);
  }
}
