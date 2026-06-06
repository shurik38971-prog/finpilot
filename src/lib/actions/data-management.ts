"use server";

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
      average_month_income: null,
      bad_month_income: null,
      good_month_income: null,
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
  await resetUserProfileType(supabase, userId);
  await resetOnboardingProgress(supabase, userId);

  revalidateDataPaths();
}

export async function fullAccountReset(): Promise<void> {
  const { supabase, userId } = await getUserId();

  await deleteUserRows(supabase, userId, [
    ...ANALYSIS_AND_TASK_TABLES,
    "financial_goals",
    "incomes",
    "expenses",
    "debts",
    "feedback_messages",
    "feedback",
    "user_feedback",
  ]);

  await resetUserProfileType(supabase, userId);
  await resetOnboardingProgress(supabase, userId);

  revalidateDataPaths();
}
