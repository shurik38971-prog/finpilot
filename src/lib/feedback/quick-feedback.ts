import type { SupabaseClient } from "@supabase/supabase-js";

export const QUICK_FEEDBACK_LOGIN_THRESHOLD = 3;
export const QUICK_FEEDBACK_COOLDOWN_DAYS = 14;

const SESSION_EVENT = "app_session_started";

export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export async function countAppSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("product_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", SESSION_EVENT);

  if (error) throw error;
  return count ?? 0;
}

export async function shouldShowQuickFeedback(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const sessionCount = await countAppSessions(supabase, userId);
  if (sessionCount < QUICK_FEEDBACK_LOGIN_THRESHOLD) return false;

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("quick_feedback_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!feedback?.quick_feedback_at) return true;

  return daysSince(feedback.quick_feedback_at) >= QUICK_FEEDBACK_COOLDOWN_DAYS;
}
