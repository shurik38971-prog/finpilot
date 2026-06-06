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

export async function clearAnalysisHistory(): Promise<void> {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateDataPaths();
}

export async function clearTasks(): Promise<void> {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase
    .from("financial_tasks")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateDataPaths();
}

export async function clearAllUserData(): Promise<void> {
  const { supabase, userId } = await getUserId();

  const steps = [
    supabase.from("financial_tasks").delete().eq("user_id", userId),
    supabase.from("analyses").delete().eq("user_id", userId),
    supabase.from("financial_goals").delete().eq("user_id", userId),
    supabase.from("feedback_messages").delete().eq("user_id", userId),
    supabase.from("feedback").delete().eq("user_id", userId),
  ];

  for (const step of steps) {
    const { error } = await step;
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidateDataPaths();
}
