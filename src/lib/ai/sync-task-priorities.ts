import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileTypeForUser } from "@/lib/actions/profile";
import { calculateTaskPriority } from "@/lib/services/task-priority";
import type { GoalType } from "@/types/goals";
import type { TaskImpact } from "@/types/task-impact";
import type { ProfileType } from "@/types/profile";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  impact_score: number;
  impact_label: string | null;
  due_date: string | null;
  goal_id: string | null;
  priority_score: number;
  financial_impact: number;
  goal: { type: GoalType } | null;
  impact: TaskImpact | TaskImpact[] | null;
}

export async function syncPendingTaskPriorities(
  supabase: SupabaseClient,
  userId: string,
  options?: { hasNegativeCashflow?: boolean; profileType?: ProfileType }
): Promise<void> {
  const profileType =
    options?.profileType ?? (await getProfileTypeForUser(supabase, userId));

  const { data, error } = await supabase
    .from("financial_tasks")
    .select(
      `
      id,
      title,
      description,
      impact_score,
      impact_label,
      due_date,
      goal_id,
      priority_score,
      financial_impact,
      escape_plan_id,
      goal:financial_goals(type),
      impact:task_impacts(*)
    `
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .is("escape_plan_id", null);

  if (error || !data?.length) return;

  await Promise.all(
    data.map(async (raw) => {
      const row = raw as unknown as TaskRow & {
        goal: { type: GoalType } | { type: GoalType }[] | null;
      };
      const impact = Array.isArray(row.impact)
        ? row.impact[0] ?? null
        : row.impact;
      const goal = Array.isArray(row.goal) ? row.goal[0] ?? null : row.goal;

      const { priority_score, financial_impact } = calculateTaskPriority(
        {
          title: row.title,
          description: row.description,
          impact_score: row.impact_score,
          impact_label: row.impact_label,
          due_date: row.due_date,
          goal_id: row.goal_id,
          goal_type: goal?.type ?? null,
        },
        {
          hasNegativeCashflow: options?.hasNegativeCashflow,
          impact,
          profileType,
        }
      );

      if (
        row.priority_score === priority_score &&
        row.financial_impact === financial_impact
      ) {
        return;
      }

      await supabase
        .from("financial_tasks")
        .update({ priority_score, financial_impact })
        .eq("id", row.id)
        .eq("user_id", userId);
    })
  );
}
