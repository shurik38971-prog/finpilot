"use server";

import {
  deduplicateUserTasksForUser,
  type DeduplicateUserTasksResult,
} from "@/lib/finance/deduplicate-user-tasks";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TASK_PATHS = ["/actions", "/dashboard", "/analyze", "/goals", "/simulator"] as const;

export type { DeduplicateUserTasksResult };

export async function deduplicateUserTasks(): Promise<DeduplicateUserTasksResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await deduplicateUserTasksForUser(supabase, user.id);

  for (const path of TASK_PATHS) {
    revalidatePath(path);
  }

  return result;
}
