"use server";

import { syncOnboardingAfterRestart } from "@/lib/actions/onboarding";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS = [
  "/dashboard",
  "/history",
  "/actions",
  "/goals",
  "/analyze",
  "/feedback",
  "/settings",
  "/simulator",
  "/scenarios",
  "/onboarding",
  "/income",
  "/expenses",
  "/debts",
  "/crisis",
  "/escape-plan",
] as const;

function revalidateDataPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { supabase, userId: user.id };
}

async function deleteUserRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tables: string[]
) {
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
  }
}

async function resetUserProfileType(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      profile_type: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function resetOnboardingProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { error } = await supabase.from("onboarding_progress").upsert(
    {
      user_id: userId,
      profile_done: false,
      income_done: false,
      expenses_done: false,
      debts_done: false,
      goal_done: false,
      analysis_done: false,
      completed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

const ANALYSIS_AND_TASK_TABLES = [
  "financial_tasks",
  "analyses",
  "task_recommendation_ratings",
  "analysis_ratings",
] as const;

async function clearEscapeRouteData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { error: plansError } = await supabase
    .from("user_escape_plans")
    .delete()
    .eq("user_id", userId);
  if (plansError) throw new Error(plansError.message);

  const { error: capsError } = await supabase
    .from("user_capabilities")
    .update({
      last_plan: null,
      last_rescue_plan: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (capsError) throw new Error(capsError.message);
}

async function clearValueFeedbackFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return;

  const { error } = await supabase
    .from("feedback")
    .update({
      value_feedback_answer: null,
      value_feedback_detail: null,
      value_feedback_at: null,
      value_feedback_dismissed_at: null,
      value_feedback_analysis_id: null,
      value_feedback_survey_version: null,
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function clearAnalysisHistory(): Promise<void> {
  const { supabase, userId } = await getUserId();
  await deleteUserRows(supabase, userId, ["analyses"]);
  revalidateDataPaths();
}

export async function clearTasks(): Promise<void> {
  const { supabase, userId } = await getUserId();
  await deleteUserRows(supabase, userId, ["financial_tasks"]);
  revalidateDataPaths();
}

/** @deprecated use fullAccountReset or restartOnboardingSetup */
export async function clearAllUserData(): Promise<void> {
  const { supabase, userId } = await getUserId();

  await deleteUserRows(supabase, userId, [
    ...ANALYSIS_AND_TASK_TABLES,
    "financial_goals",
    "feedback_messages",
    "feedback",
  ]);

  revalidateDataPaths();
}

export async function restartOnboardingSetup(): Promise<void> {
  const { supabase, userId } = await getUserId();

  await deleteUserRows(supabase, userId, [...ANALYSIS_AND_TASK_TABLES]);
  await clearEscapeRouteData(supabase, userId);
  await clearValueFeedbackFields(supabase, userId);
  await resetUserProfileType(supabase, userId);
  await resetOnboardingProgress(supabase, userId);
  await syncOnboardingAfterRestart(supabase, userId);

  revalidateDataPaths();
}

export async function fullAccountReset(): Promise<void> {
  const { supabase, userId } = await getUserId();

  await deleteUserRows(supabase, userId, [
    ...ANALYSIS_AND_TASK_TABLES,
    "financial_goals",
    "user_escape_plans",
    "incomes",
    "expenses",
    "debts",
    "feedback_messages",
    "feedback",
    "user_feedback",
  ]);

  await deleteUserRows(supabase, userId, ["user_capabilities"]);
  await resetUserProfileType(supabase, userId);
  await resetOnboardingProgress(supabase, userId);

  revalidateDataPaths();
}
