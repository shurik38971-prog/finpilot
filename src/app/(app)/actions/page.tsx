import { getFinancialMeasureTasks, getFinancialTasks } from "@/lib/actions/tasks";
import { deduplicateUserTasksForUser } from "@/lib/finance/deduplicate-user-tasks";
import { isCleanupMode } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";
import { ActionsPageClient } from "./actions-client";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await deduplicateUserTasksForUser(supabase, user.id);
    } catch (error) {
      console.error("Failed to deduplicate tasks on actions page:", error);
    }
  }

  const cleanupMode = isCleanupMode();
  const [tasks, additionalTasks] = await Promise.all([
    getFinancialTasks({ activeEscapePlanOnly: cleanupMode }),
    cleanupMode ? getFinancialMeasureTasks() : Promise.resolve([]),
  ]);
  return (
    <ActionsPageClient
      tasks={tasks}
      additionalTasks={additionalTasks}
      cleanupMode={cleanupMode}
    />
  );
}
