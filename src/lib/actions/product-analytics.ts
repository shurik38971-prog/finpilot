"use server";

import { isAdminUser } from "@/lib/admin/is-admin";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";

export interface ProductAnalyticsDashboard {
  periodDays: number;
  funnel: {
    registrations: number;
    addedIncome: number;
    addedExpense: number;
    startedAnalysis: number;
    createdGoal: number;
    completedTask: number;
  };
  retention: {
    day1: { count: number; percent: number };
    day7: { count: number; percent: number };
    day30: { count: number; percent: number };
  };
  activation: {
    activated: number;
    totalUsers: number;
    ratePercent: number;
  };
  usefulness: {
    avgAnalysisRating: number | null;
    avgRecommendationRating: number | null;
    completedTasks: number;
    returnedDay7: number;
  };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isAdminUser(supabase, user.email))) {
    throw new Error("Forbidden");
  }

  return supabase;
}

function sinceDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dayOffset(startIso: string, eventIso: string): number {
  const start = startOfUtcDay(new Date(startIso));
  const event = startOfUtcDay(new Date(eventIso));
  return Math.round((event - start) / (24 * 60 * 60 * 1000));
}

function uniqueUsersWithEvent(
  events: { user_id: string; event_name: string }[],
  eventName: string
): number {
  return new Set(
    events.filter((event) => event.event_name === eventName).map((e) => e.user_id)
  ).size;
}

function usersWithAllEvents(
  events: { user_id: string; event_name: string }[],
  required: string[]
): number {
  const byUser = new Map<string, Set<string>>();

  for (const event of events) {
    if (!byUser.has(event.user_id)) {
      byUser.set(event.user_id, new Set());
    }
    byUser.get(event.user_id)!.add(event.event_name);
  }

  let count = 0;
  for (const eventSet of byUser.values()) {
    if (required.every((name) => eventSet.has(name))) {
      count += 1;
    }
  }

  return count;
}

function computeRetention(
  events: { user_id: string; event_name: string; created_at: string }[]
) {
  const signupAt = new Map<string, string>();
  const firstAt = new Map<string, string>();

  for (const event of events) {
    if (event.event_name === PRODUCT_EVENTS.SIGNUP_COMPLETED) {
      const existing = signupAt.get(event.user_id);
      if (!existing || event.created_at < existing) {
        signupAt.set(event.user_id, event.created_at);
      }
    }

    const first = firstAt.get(event.user_id);
    if (!first || event.created_at < first) {
      firstAt.set(event.user_id, event.created_at);
    }
  }

  const cohortUsers = new Set<string>([
    ...signupAt.keys(),
    ...firstAt.keys(),
  ]);

  let d1 = 0;
  let d7 = 0;
  let d30 = 0;

  for (const userId of cohortUsers) {
    const start = signupAt.get(userId) ?? firstAt.get(userId);
    if (!start) continue;

    const userEvents = events.filter(
      (event) =>
        event.user_id === userId &&
        event.event_name !== PRODUCT_EVENTS.SIGNUP_COMPLETED
    );

    const offsets = new Set(
      userEvents.map((event) => dayOffset(start, event.created_at))
    );

    if (offsets.has(1)) d1 += 1;
    if (offsets.has(7)) d7 += 1;
    if (offsets.has(30)) d30 += 1;
  }

  const total = cohortUsers.size || 1;

  return {
    day1: {
      count: d1,
      percent: Math.round((d1 / total) * 1000) / 10,
    },
    day7: {
      count: d7,
      percent: Math.round((d7 / total) * 1000) / 10,
    },
    day30: {
      count: d30,
      percent: Math.round((d30 / total) * 1000) / 10,
    },
  };
}

function recommendationScore(rating: string): number | null {
  if (rating === "strongly") return 3;
  if (rating === "slightly") return 2;
  if (rating === "no") return 1;
  return null;
}

export async function getProductAnalytics(
  days = 30
): Promise<ProductAnalyticsDashboard> {
  const supabase = await requireAdmin();
  const since = sinceDate(days);

  const [
    { data: events, error: eventsError },
    { data: analysisRatings, error: analysisError },
    { data: recommendationRatings, error: recommendationError },
  ] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("user_id, event_name, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20000),
    supabase
      .from("analysis_ratings")
      .select("rating")
      .gte("created_at", since),
    supabase
      .from("task_recommendation_ratings")
      .select("rating")
      .gte("created_at", since),
  ]);

  if (eventsError) throw eventsError;
  if (analysisError) throw analysisError;
  if (recommendationError) throw recommendationError;

  const allEvents = events ?? [];
  const allAnalysisRatings = analysisRatings ?? [];
  const allRecommendationRatings = recommendationRatings ?? [];

  const totalUsers = new Set(allEvents.map((event) => event.user_id)).size;

  const activated = usersWithAllEvents(allEvents, [
    PRODUCT_EVENTS.INCOME_ADDED,
    PRODUCT_EVENTS.EXPENSE_ADDED,
    PRODUCT_EVENTS.ANALYSIS_COMPLETED,
  ]);

  const retention = computeRetention(allEvents);

  const avgAnalysisRating =
    allAnalysisRatings.length > 0
      ? Math.round(
          (allAnalysisRatings.reduce((sum, row) => sum + row.rating, 0) /
            allAnalysisRatings.length) *
            10
        ) / 10
      : null;

  const recommendationScores = allRecommendationRatings
    .map((row) => recommendationScore(row.rating))
    .filter((score): score is number => score != null);

  const avgRecommendationRating =
    recommendationScores.length > 0
      ? Math.round(
          (recommendationScores.reduce((sum, score) => sum + score, 0) /
            recommendationScores.length) *
            10
        ) / 10
      : null;

  return {
    periodDays: days,
    funnel: {
      registrations: uniqueUsersWithEvent(
        allEvents,
        PRODUCT_EVENTS.SIGNUP_COMPLETED
      ),
      addedIncome: uniqueUsersWithEvent(allEvents, PRODUCT_EVENTS.INCOME_ADDED),
      addedExpense: uniqueUsersWithEvent(
        allEvents,
        PRODUCT_EVENTS.EXPENSE_ADDED
      ),
      startedAnalysis: uniqueUsersWithEvent(
        allEvents,
        PRODUCT_EVENTS.ANALYSIS_STARTED
      ),
      createdGoal: uniqueUsersWithEvent(allEvents, PRODUCT_EVENTS.GOAL_CREATED),
      completedTask: uniqueUsersWithEvent(
        allEvents,
        PRODUCT_EVENTS.TASK_COMPLETED
      ),
    },
    retention,
    activation: {
      activated,
      totalUsers,
      ratePercent:
        totalUsers > 0
          ? Math.round((activated / totalUsers) * 1000) / 10
          : 0,
    },
    usefulness: {
      avgAnalysisRating,
      avgRecommendationRating,
      completedTasks: allEvents.filter(
        (event) => event.event_name === PRODUCT_EVENTS.TASK_COMPLETED
      ).length,
      returnedDay7: retention.day7.count,
    },
  };
}
