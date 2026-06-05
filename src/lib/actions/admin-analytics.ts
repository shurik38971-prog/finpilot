"use server";

import { isAdminUser } from "@/lib/admin/is-admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminAnalyticsDashboard {
  periodDays: number;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  firstClicks: { label: string; count: number }[];
  topPages: { path: string; count: number }[];
  entryPages: { path: string; count: number }[];
  topNavClicks: { label: string; count: number }[];
  funnel: {
    signups: number;
    analyzed: number;
    tasksDone: number;
    feedback: number;
  };
  feedback: {
    id: string;
    feedback_type: string;
    message: string;
    page_path: string | null;
    created_at: string;
    user_id: string;
  }[];
  confusions: AdminAnalyticsDashboard["feedback"];
  recentEvents: {
    id: string;
    event_name: string;
    page_path: string | null;
    element_id: string | null;
    properties: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }[];
  productFeedback: {
    responseCount: number;
    recentMessages: {
      id: string;
      type: string;
      message: string;
      created_at: string;
      user_id: string;
    }[];
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

  return { supabase, user };
}

function sinceDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function countBy<T>(
  items: T[],
  keyFn: (item: T) => string,
  labelFn?: (key: string, item: T) => string
): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({
      label: labelFn ? labelFn(key, items[0]!) : key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getAdminAnalytics(
  days = 30
): Promise<AdminAnalyticsDashboard> {
  const { supabase } = await requireAdmin();
  const since = sinceDate(days);

  const [
    { data: events, error: eventsError },
    { data: feedback, error: feedbackError },
    { data: productSurveys, error: surveysError },
    { data: feedbackMessages, error: messagesError },
  ] = await Promise.all([
    supabase
      .from("product_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("user_feedback")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("feedback")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("feedback_messages")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (eventsError) throw eventsError;
  if (feedbackError) throw feedbackError;
  if (surveysError) throw surveysError;
  if (messagesError) throw messagesError;

  const allEvents = events ?? [];
  const allFeedback = feedback ?? [];
  const allSurveys = productSurveys ?? [];
  const allMessages = feedbackMessages ?? [];

  const uniqueUsers = new Set(
    allEvents.map((e) => e.user_id).filter(Boolean)
  ).size;
  const uniqueSessions = new Set(allEvents.map((e) => e.session_id)).size;

  const firstClickEvents = allEvents.filter((e) => e.event_name === "first_click");
  const firstClicks = countBy(firstClickEvents, (e) => {
    const props = e.properties as { label?: string };
    return props?.label || e.element_id || "неизвестно";
  });

  const pageViews = allEvents.filter((e) => e.event_name === "page_view");
  const topPages = countBy(pageViews, (e) => e.page_path ?? "/").map((x) => ({
    path: x.label,
    count: x.count,
  }));

  const sessionFirstPage = new Map<string, string>();
  for (const e of [...pageViews].reverse()) {
    if (!sessionFirstPage.has(e.session_id)) {
      sessionFirstPage.set(e.session_id, e.page_path ?? "/");
    }
  }
  const entryPageCounts = new Map<string, number>();
  for (const path of sessionFirstPage.values()) {
    entryPageCounts.set(path, (entryPageCounts.get(path) ?? 0) + 1);
  }
  const entryPages = [...entryPageCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);

  const navEvents = allEvents.filter((e) => e.event_name === "nav_click");
  const topNavClicks = countBy(navEvents, (e) => {
    const props = e.properties as { label?: string };
    return props?.label || e.element_id || "nav";
  });

  const funnel = {
    signups: allEvents.filter((e) => e.event_name === "signup_completed").length,
    analyzed: allEvents.filter((e) => e.event_name === "analyze_completed")
      .length,
    tasksDone: allEvents.filter((e) => e.event_name === "task_completed").length,
    feedback: allFeedback.length,
  };

  const confusions = allFeedback.filter((f) => f.feedback_type === "confusion");

  return {
    periodDays: days,
    totalEvents: allEvents.length,
    uniqueUsers,
    uniqueSessions,
    firstClicks: firstClicks.slice(0, 10),
    topPages: topPages.slice(0, 10),
    entryPages: entryPages.slice(0, 10),
    topNavClicks: topNavClicks.slice(0, 10),
    funnel,
    feedback: allFeedback.slice(0, 50) as AdminAnalyticsDashboard["feedback"],
    confusions: confusions.slice(0, 20) as AdminAnalyticsDashboard["feedback"],
    recentEvents: allEvents.slice(0, 40).map((e) => ({
      id: e.id,
      event_name: e.event_name,
      page_path: e.page_path,
      element_id: e.element_id,
      properties: (e.properties as Record<string, unknown>) ?? {},
      created_at: e.created_at,
      user_id: e.user_id,
    })),
    productFeedback: {
      responseCount: allSurveys.length,
      recentMessages: allMessages.slice(0, 30) as AdminAnalyticsDashboard["productFeedback"]["recentMessages"],
    },
  };
}
