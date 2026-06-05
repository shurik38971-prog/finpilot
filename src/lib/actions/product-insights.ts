"use server";

import { isAdminUser } from "@/lib/admin/is-admin";
import { createClient } from "@/lib/supabase/server";

export interface ProductInsightsDashboard {
  periodDays: number;
  totalUsers: number;
  totalAnalyses: number;
  feedbackCount: number;
  usersWhoTookAction: number;
  actionSuccessRate: number | null;
  popularFeatures: { label: string; count: number }[];
  commonConfusions: { text: string; created_at: string }[];
  commonFeatureRequests: { text: string; created_at: string }[];
  lostValueQuotes: { text: string; created_at: string }[];
  actionDescriptions: { text: string; created_at: string }[];
  reactivationCampaigns: {
    sent: number;
    opened: number;
    completed: number;
    yesCount: number;
    noCount: number;
  };
  recentSurveys: {
    id: string;
    most_useful_feature: string | null;
    took_action: boolean | null;
    action_description: string | null;
    confusion_text: string | null;
    missing_feature: string | null;
    lost_value_text: string | null;
    created_at: string;
    user_id: string;
  }[];
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

function countByLabel(
  items: string[]
): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item) continue;
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getProductInsights(
  days = 90
): Promise<ProductInsightsDashboard> {
  const supabase = await requireAdmin();
  const since = sinceDate(days);

  const [
    { data: analyses, error: analysesError },
    { data: feedback, error: feedbackError },
    { data: campaigns, error: campaignsError },
  ] = await Promise.all([
    supabase
      .from("analyses")
      .select("user_id, created_at")
      .gte("created_at", since),
    supabase
      .from("feedback")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_campaigns")
      .select("*")
      .gte("sent_at", since),
  ]);

  if (analysesError) throw analysesError;
  if (feedbackError) throw feedbackError;
  if (campaignsError) throw campaignsError;

  const allAnalyses = analyses ?? [];
  const allFeedback = feedback ?? [];
  const allCampaigns = campaigns ?? [];

  const totalUsers = new Set(allAnalyses.map((a) => a.user_id)).size;
  const totalAnalyses = allAnalyses.length;
  const feedbackCount = allFeedback.length;
  const usersWhoTookAction = allFeedback.filter((f) => f.took_action).length;
  const actionSuccessRate =
    feedbackCount > 0
      ? Math.round((usersWhoTookAction / feedbackCount) * 1000) / 10
      : null;

  const popularFeatures = countByLabel(
    allFeedback
      .map((f) => f.most_useful_feature)
      .filter((x): x is string => Boolean(x))
  );

  const commonConfusions = allFeedback
    .filter((f) => f.confusion_text?.trim())
    .slice(0, 15)
    .map((f) => ({
      text: f.confusion_text as string,
      created_at: f.created_at,
    }));

  const commonFeatureRequests = allFeedback
    .filter((f) => f.missing_feature?.trim())
    .slice(0, 15)
    .map((f) => ({
      text: f.missing_feature as string,
      created_at: f.created_at,
    }));

  const lostValueQuotes = allFeedback
    .filter((f) => f.lost_value_text?.trim())
    .slice(0, 10)
    .map((f) => ({
      text: f.lost_value_text as string,
      created_at: f.created_at,
    }));

  const actionDescriptions = allFeedback
    .filter((f) => f.action_description?.trim())
    .slice(0, 15)
    .map((f) => ({
      text: f.action_description as string,
      created_at: f.created_at,
    }));

  const reactivationCampaigns = {
    sent: allCampaigns.length,
    opened: allCampaigns.filter((c) => c.opened).length,
    completed: allCampaigns.filter((c) => c.completed).length,
    yesCount: allCampaigns.filter((c) => c.response_answer === "yes").length,
    noCount: allCampaigns.filter((c) => c.response_answer === "no").length,
  };

  return {
    periodDays: days,
    totalUsers,
    totalAnalyses,
    feedbackCount,
    usersWhoTookAction,
    actionSuccessRate,
    popularFeatures: popularFeatures.slice(0, 10),
    commonConfusions,
    commonFeatureRequests,
    lostValueQuotes,
    actionDescriptions,
    reactivationCampaigns,
    recentSurveys: allFeedback.slice(0, 25) as ProductInsightsDashboard["recentSurveys"],
  };
}
