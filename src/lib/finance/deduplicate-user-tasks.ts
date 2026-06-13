import type { SupabaseClient } from "@supabase/supabase-js";
import { detectTaskCategory } from "@/lib/finance/detect-task-category";
import { descriptionSpecificity } from "@/lib/finance/pick-better-task";

interface ActiveTaskRow {
  id: string;
  title: string;
  description: string | null;
  impact_score: number;
  priority_score: number;
  task_category: string | null;
  status: string;
  escape_plan_id: string | null;
  normalized_title: string | null;
}

function isFinancialMeasureTask(task: ActiveTaskRow): boolean {
  return task.normalized_title?.startsWith("measure:") ?? false;
}

export interface DeduplicateUserTasksResult {
  archived_count: number;
  kept_count: number;
}

export async function deduplicateUserTasksForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DeduplicateUserTasksResult> {
  const { data: tasks, error } = await supabase
    .from("financial_tasks")
    .select(
      "id, title, description, impact_score, priority_score, task_category, status, escape_plan_id, normalized_title"
    )
    .eq("user_id", userId)
    .in("status", ["pending", "postponed"]);

  if (error) throw error;

  const activeTasks = (tasks ?? []) as ActiveTaskRow[];
  if (activeTasks.length === 0) {
    return { archived_count: 0, kept_count: 0 };
  }

  const routeTasks = activeTasks.filter((task) => task.escape_plan_id);
  const regularTasks = activeTasks.filter((task) => !task.escape_plan_id);
  const measureTasks = regularTasks.filter(isFinancialMeasureTask);
  const otherRegular = regularTasks.filter((task) => !isFinancialMeasureTask(task));

  const groups = new Map<string, ActiveTaskRow[]>();

  for (const task of otherRegular) {
    const category =
      task.task_category ??
      detectTaskCategory(task.title, task.description);
    const bucket = groups.get(category) ?? [];
    bucket.push({ ...task, task_category: category });
    groups.set(category, bucket);
  }

  const toArchive: string[] = [];
  let keptCount = routeTasks.length + measureTasks.length;

  for (const group of groups.values()) {
    const keeper = [...group].sort(
      (a, b) =>
        b.priority_score - a.priority_score ||
        b.impact_score - a.impact_score ||
        descriptionSpecificity(b.description) -
          descriptionSpecificity(a.description)
    )[0];

    keptCount += 1;

    for (const task of group) {
      if (task.id === keeper.id) continue;
      toArchive.push(task.id);
    }
  }

  if (toArchive.length > 0) {
    const { error: archiveError } = await supabase
      .from("financial_tasks")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .in("id", toArchive);

    if (archiveError) throw archiveError;
  }

  return {
    archived_count: toArchive.length,
    kept_count: keptCount,
  };
}
