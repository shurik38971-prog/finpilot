import type { SupabaseClient } from "@supabase/supabase-js";

export const VALUE_FEEDBACK_SURVEY_VERSION = 1;
export const MIN_MINUTES_AFTER_ANALYSIS = 2;
export const VALUE_FEEDBACK_DISMISS_COOLDOWN_HOURS = 24;

const PAGE_VIEW = "page_view";
const DASHBOARD_OPENED = "dashboard_opened";

const JOURNEY_PATHS = {
  dashboard: "/dashboard",
  escapePlan: "/escape-plan",
  actions: "/actions",
} as const;

interface LatestAnalysis {
  id: string;
  createdAt: Date;
}

async function getLatestAnalysis(
  supabase: SupabaseClient,
  userId: string
): Promise<LatestAnalysis | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.created_at) return null;

  return {
    id: data.id,
    createdAt: new Date(data.created_at),
  };
}

async function hasPageViewAfter(
  supabase: SupabaseClient,
  userId: string,
  pagePath: string,
  after: Date
): Promise<boolean> {
  const { count, error } = await supabase
    .from("product_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", PAGE_VIEW)
    .eq("page_path", pagePath)
    .gte("created_at", after.toISOString());

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function hasDashboardViewedAfter(
  supabase: SupabaseClient,
  userId: string,
  after: Date
): Promise<boolean> {
  const pageView = await hasPageViewAfter(
    supabase,
    userId,
    JOURNEY_PATHS.dashboard,
    after
  );
  if (pageView) return true;

  const { count, error } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", DASHBOARD_OPENED)
    .gte("created_at", after.toISOString());

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function getActiveRouteAfterAnalysis(
  supabase: SupabaseClient,
  userId: string,
  analysisAt: Date
): Promise<{ id: string; updatedAt: Date } | null> {
  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("id, updated_at, attempt_status")
    .eq("user_id", userId)
    .in("attempt_status", ["in_progress", "success"])
    .gte("updated_at", analysisAt.toISOString())
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.updated_at) return null;

  return {
    id: data.id,
    updatedAt: new Date(data.updated_at),
  };
}

async function hasEscapeRouteStep(
  supabase: SupabaseClient,
  userId: string,
  escapePlanId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("financial_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escape_plan_id", escapePlanId)
    .neq("status", "archived");

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function hasCompletedValueJourney(
  supabase: SupabaseClient,
  userId: string,
  analysisAt: Date
): Promise<boolean> {
  const [dashboardViewed, escapePlanViewed] = await Promise.all([
    hasDashboardViewedAfter(supabase, userId, analysisAt),
    hasPageViewAfter(supabase, userId, JOURNEY_PATHS.escapePlan, analysisAt),
  ]);

  if (!dashboardViewed || !escapePlanViewed) return false;

  const activeRoute = await getActiveRouteAfterAnalysis(
    supabase,
    userId,
    analysisAt
  );
  if (!activeRoute) return false;

  const [actionsAfterRoute, hasFirstStep] = await Promise.all([
    hasPageViewAfter(
      supabase,
      userId,
      JOURNEY_PATHS.actions,
      activeRoute.updatedAt
    ),
    hasEscapeRouteStep(supabase, userId, activeRoute.id),
  ]);

  return actionsAfterRoute && hasFirstStep;
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function isAnsweredForCurrentCycle(
  feedback: {
    value_feedback_answer: string | null;
    value_feedback_at: string | null;
    value_feedback_analysis_id: string | null;
    value_feedback_survey_version: number | null;
  },
  analysis: LatestAnalysis
): boolean {
  if (!feedback.value_feedback_answer) return false;

  const surveyVersion = feedback.value_feedback_survey_version ?? 1;
  if (surveyVersion < VALUE_FEEDBACK_SURVEY_VERSION) return false;

  if (feedback.value_feedback_analysis_id) {
    return feedback.value_feedback_analysis_id === analysis.id;
  }

  if (!feedback.value_feedback_at) return false;
  return new Date(feedback.value_feedback_at) >= analysis.createdAt;
}

function isDismissCooldownActive(feedback: {
  value_feedback_answer: string | null;
  value_feedback_at: string | null;
  value_feedback_dismissed_at: string | null;
}): boolean {
  if (feedback.value_feedback_answer) return false;

  const dismissedAt =
    feedback.value_feedback_dismissed_at ??
    (feedback.value_feedback_at && !feedback.value_feedback_answer
      ? feedback.value_feedback_at
      : null);

  if (!dismissedAt) return false;
  return hoursSince(dismissedAt) < VALUE_FEEDBACK_DISMISS_COOLDOWN_HOURS;
}

function hasMinTimeAfterAnalysis(analysisAt: Date): boolean {
  const elapsedMs = Date.now() - analysisAt.getTime();
  return elapsedMs >= MIN_MINUTES_AFTER_ANALYSIS * 60 * 1000;
}

export async function shouldShowValueFeedback(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const analysis = await getLatestAnalysis(supabase, userId);
  if (!analysis) return false;

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select(
      "value_feedback_answer, value_feedback_at, value_feedback_dismissed_at, value_feedback_analysis_id, value_feedback_survey_version"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (feedback && isAnsweredForCurrentCycle(feedback, analysis)) {
    return false;
  }

  if (feedback && isDismissCooldownActive(feedback)) {
    return false;
  }

  if (!hasMinTimeAfterAnalysis(analysis.createdAt)) {
    return false;
  }

  return hasCompletedValueJourney(supabase, userId, analysis.createdAt);
}
