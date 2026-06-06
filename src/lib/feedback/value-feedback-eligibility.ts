import type { SupabaseClient } from "@supabase/supabase-js";
import { daysSince } from "@/lib/feedback/quick-feedback";

export const VALUE_FEEDBACK_COOLDOWN_DAYS = 14;
export const POST_ANALYSIS_ENGAGEMENT_MINUTES = 5;
export const ANALYSIS_PAGE_VIEW_THRESHOLD = 2;

const ANALYSIS_PATHS = ["/analyze", "/history"] as const;
const PAGE_VIEW = "page_view";
const APP_SESSION = "app_session_started";
const TASK_COMPLETED = "task_completed";

function utcDay(iso: string): string {
  return iso.slice(0, 10);
}

async function getLatestAnalysisAt(
  supabase: SupabaseClient,
  userId: string
): Promise<Date | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.created_at ? new Date(data.created_at) : null;
}

async function hasFiveMinutesAfterAnalysis(
  supabase: SupabaseClient,
  userId: string,
  analysisAt: Date,
  clientEngagementMinutes?: number
): Promise<boolean> {
  if ((clientEngagementMinutes ?? 0) >= POST_ANALYSIS_ENGAGEMENT_MINUTES) {
    return true;
  }

  const threshold = new Date(
    analysisAt.getTime() + POST_ANALYSIS_ENGAGEMENT_MINUTES * 60 * 1000
  );

  const { count, error } = await supabase
    .from("product_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", threshold.toISOString());

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function hasAnalysisPageViews(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("product_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", PAGE_VIEW)
    .in("page_path", [...ANALYSIS_PATHS]);

  if (error) throw error;
  return (count ?? 0) >= ANALYSIS_PAGE_VIEW_THRESHOLD;
}

async function hasCompletedTask(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [productEvents, analyticsEvents, completedTasks] = await Promise.all([
    supabase
      .from("product_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_name", TASK_COMPLETED),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_name", TASK_COMPLETED),
    supabase
      .from("financial_tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  if (productEvents.error) throw productEvents.error;
  if (analyticsEvents.error) throw analyticsEvents.error;
  if (completedTasks.error) throw completedTasks.error;

  return (
    (productEvents.count ?? 0) > 0 ||
    (analyticsEvents.count ?? 0) > 0 ||
    (completedTasks.count ?? 0) > 0
  );
}

async function hasReturnedNextDay(
  supabase: SupabaseClient,
  userId: string,
  analysisAt: Date
): Promise<boolean> {
  const analysisDay = utcDay(analysisAt.toISOString());

  const { data, error } = await supabase
    .from("product_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("event_name", APP_SESSION)
    .gt("created_at", analysisAt.toISOString());

  if (error) throw error;

  return (data ?? []).some(
    (session) => utcDay(session.created_at) !== analysisDay
  );
}

export async function shouldShowValueFeedback(
  supabase: SupabaseClient,
  userId: string,
  options?: { clientEngagementMinutes?: number }
): Promise<boolean> {
  const analysisAt = await getLatestAnalysisAt(supabase, userId);
  if (!analysisAt) return false;

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("value_feedback_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (
    feedback?.value_feedback_at &&
    daysSince(feedback.value_feedback_at) < VALUE_FEEDBACK_COOLDOWN_DAYS
  ) {
    return false;
  }

  const [fiveMinutes, analysisViews, taskDone, nextDay] = await Promise.all([
    hasFiveMinutesAfterAnalysis(
      supabase,
      userId,
      analysisAt,
      options?.clientEngagementMinutes
    ),
    hasAnalysisPageViews(supabase, userId),
    hasCompletedTask(supabase, userId),
    hasReturnedNextDay(supabase, userId, analysisAt),
  ]);

  return fiveMinutes || analysisViews || taskDone || nextDay;
}
