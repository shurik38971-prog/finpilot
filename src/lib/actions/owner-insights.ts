"use server";

import { isAdminUser } from "@/lib/admin/is-admin";
import { lowRatingReasonLabel } from "@/lib/feedback/low-rating-reasons";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";

export interface FunnelStepInsight {
  label: string;
  fromCount: number;
  toCount: number;
  conversionPercent: number;
  dropPercent: number;
}

export interface OwnerInsightsDashboard {
  periodDays: number;
  overview: {
    totalUsers: number;
    newUsers7d: number;
    activatedUsers: number;
    activationRatePercent: number;
  };
  topRecommendations: { title: string; count: number }[];
  lowRatedRecommendations: {
    title: string;
    count: number;
    avgScore: number;
  }[];
  lowRatingReasons: { label: string; count: number }[];
  topGoals: { label: string; count: number }[];
  funnelSteps: FunnelStepInsight[];
  biggestFunnelDrop: FunnelStepInsight | null;
  ownerSummary: string;
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

function usersWithEvent(
  events: { user_id: string; event_name: string }[],
  eventName: string
): Set<string> {
  return new Set(
    events
      .filter((event) => event.event_name === eventName)
      .map((event) => event.user_id)
  );
}

function countByKey<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined
): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function categorizeGoal(type: string | undefined, title: string | undefined): string {
  if (type === "safety_cushion") return "Подушка безопасности";
  if (type === "debt_payoff") return "Погашение долгов";

  const normalized = (title ?? "").toLowerCase();
  if (normalized.includes("автомоб") || normalized.includes("машин")) {
    return "Покупка автомобиля";
  }

  return "Накопления";
}

function recommendationScore(rating: string): number {
  if (rating === "strongly") return 3;
  if (rating === "slightly") return 2;
  return 1;
}

function buildFunnelSteps(
  events: { user_id: string; event_name: string }[]
): FunnelStepInsight[] {
  const steps = [
    { key: PRODUCT_EVENTS.SIGNUP_COMPLETED, label: "Регистрация → Доход" },
    { key: PRODUCT_EVENTS.INCOME_ADDED, label: "Доход → Расход" },
    { key: PRODUCT_EVENTS.EXPENSE_ADDED, label: "Расход → Анализ" },
    { key: PRODUCT_EVENTS.ANALYSIS_COMPLETED, label: "Анализ → Цель" },
    { key: PRODUCT_EVENTS.GOAL_CREATED, label: "Цель → Выполненная задача" },
    { key: PRODUCT_EVENTS.TASK_COMPLETED, label: "Задача выполнена" },
  ];

  const sets = steps.map((step) => usersWithEvent(events, step.key));

  const result: FunnelStepInsight[] = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    const fromCount = sets[i]!.size;
    const toCount = sets[i + 1]!.size;
    const conversionPercent =
      fromCount > 0 ? Math.round((toCount / fromCount) * 1000) / 10 : 0;
    const dropPercent =
      fromCount > 0
        ? Math.round(((fromCount - toCount) / fromCount) * 1000) / 10
        : 0;

    result.push({
      label: steps[i]!.label,
      fromCount,
      toCount,
      conversionPercent,
      dropPercent,
    });
  }

  return result;
}

function buildOwnerSummary(input: {
  newUsers7d: number;
  activatedUsers7d: number;
  activationRate7d: number;
  topGoal: string | null;
  topRecommendation: string | null;
  biggestDrop: FunnelStepInsight | null;
}): string {
  const parts: string[] = [];

  parts.push(
    `За последние 7 дней зарегистрировалось ${input.newUsers7d} пользователей.`
  );
  parts.push(
    `Активировалось ${input.activatedUsers7d} (${input.activationRate7d}%).`
  );

  if (input.topGoal) {
    parts.push(
      `Чаще всего пользователи создают цель «${input.topGoal}».`
    );
  }

  if (input.topRecommendation) {
    parts.push(
      `Лучше всего работают рекомендации «${input.topRecommendation}».`
    );
  }

  if (input.biggestDrop) {
    const dropText = funnelDropDescription(input.biggestDrop.label);
    parts.push(`Основной провал в воронке — ${dropText}.`);
  }

  return parts.join(" ");
}

function funnelDropDescription(stepLabel: string): string {
  switch (stepLabel) {
    case "Регистрация → Доход":
      return "пользователи не добавляют доход";
    case "Доход → Расход":
      return "пользователи не добавляют расходы";
    case "Расход → Анализ":
      return "пользователи не запускают анализ";
    case "Анализ → Цель":
      return "пользователи не создают цель";
    case "Цель → Выполненная задача":
      return "пользователи не выполняют задачи";
    default:
      return "пользователи отваливаются на следующем шаге";
  }
}

export async function getOwnerInsights(
  periodDays = 30
): Promise<OwnerInsightsDashboard> {
  const supabase = await requireAdmin();
  const since = sinceDate(periodDays);
  const since7d = sinceDate(7);

  const [
    { data: allEvents, error: allEventsError },
    { data: periodEvents, error: periodEventsError },
    { data: ratings, error: ratingsError },
    { data: goals, error: goalsError },
  ] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("user_id, event_name, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(50000),
    supabase
      .from("analytics_events")
      .select("user_id, event_name, metadata, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000),
    supabase
      .from("task_recommendation_ratings")
      .select("task_id, task_title, rating, low_rating_reason, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("financial_goals")
      .select("type, title, created_at")
      .gte("created_at", since),
  ]);

  if (allEventsError) throw allEventsError;
  if (periodEventsError) throw periodEventsError;
  if (ratingsError) throw ratingsError;
  if (goalsError) throw goalsError;

  const eventsAll = allEvents ?? [];
  const eventsPeriod = periodEvents ?? [];
  const allRatings = ratings ?? [];
  const allGoals = goals ?? [];

  const totalUsers = new Set(eventsAll.map((event) => event.user_id)).size;

  const newUsers7d = usersWithEvent(
    eventsAll.filter((event) => event.created_at >= since7d),
    PRODUCT_EVENTS.SIGNUP_COMPLETED
  ).size;

  const activatedAll = [...usersWithEvent(eventsAll, PRODUCT_EVENTS.INCOME_ADDED)].filter(
    (userId) =>
      usersWithEvent(eventsAll, PRODUCT_EVENTS.EXPENSE_ADDED).has(userId) &&
      usersWithEvent(eventsAll, PRODUCT_EVENTS.ANALYSIS_COMPLETED).has(userId)
  ).length;

  const activationRatePercent =
    totalUsers > 0 ? Math.round((activatedAll / totalUsers) * 1000) / 10 : 0;

  const activatedUsers7d = [...usersWithEvent(
    eventsAll.filter((event) => event.created_at >= since7d),
    PRODUCT_EVENTS.SIGNUP_COMPLETED
  )].filter(
    (userId) =>
      usersWithEvent(eventsAll, PRODUCT_EVENTS.INCOME_ADDED).has(userId) &&
      usersWithEvent(eventsAll, PRODUCT_EVENTS.EXPENSE_ADDED).has(userId) &&
      usersWithEvent(eventsAll, PRODUCT_EVENTS.ANALYSIS_COMPLETED).has(userId)
  ).length;

  const activationRate7d =
    newUsers7d > 0
      ? Math.round((activatedUsers7d / newUsers7d) * 1000) / 10
      : 0;

  const taskCompletions = eventsPeriod.filter(
    (event) => event.event_name === PRODUCT_EVENTS.TASK_COMPLETED
  );

  const topRecommendations = countByKey(taskCompletions, (event) => {
    const metadata = event.metadata as { title?: string };
    return metadata?.title?.trim() || null;
  })
    .map((item) => ({ title: item.label, count: item.count }))
    .slice(0, 10);

  const lowRatedMap = new Map<
    string,
    { count: number; totalScore: number }
  >();

  for (const rating of allRatings) {
    if (rating.rating === "strongly") continue;

    const title = rating.task_title?.trim() || "Без названия";
    const current = lowRatedMap.get(title) ?? { count: 0, totalScore: 0 };
    current.count += 1;
    current.totalScore += recommendationScore(rating.rating);
    lowRatedMap.set(title, current);
  }

  const lowRatedRecommendations = [...lowRatedMap.entries()]
    .map(([title, stats]) => ({
      title,
      count: stats.count,
      avgScore: Math.round((stats.totalScore / stats.count) * 10) / 10,
    }))
    .sort((a, b) => a.avgScore - b.avgScore || b.count - a.count)
    .slice(0, 10);

  const lowRatingReasons = countByKey(allRatings, (rating) =>
    lowRatingReasonLabel(rating.low_rating_reason)
  ).slice(0, 10);

  const goalEvents = eventsPeriod.filter(
    (event) => event.event_name === PRODUCT_EVENTS.GOAL_CREATED
  );

  const topGoalsFromEvents = countByKey(goalEvents, (event) => {
    const metadata = event.metadata as { type?: string; title?: string };
    return categorizeGoal(metadata?.type, metadata?.title);
  });

  const topGoalsFromTable = countByKey(allGoals, (goal) =>
    categorizeGoal(goal.type, goal.title)
  );

  const goalMap = new Map<string, number>();
  for (const item of [...topGoalsFromEvents, ...topGoalsFromTable]) {
    goalMap.set(item.label, (goalMap.get(item.label) ?? 0) + item.count);
  }

  const topGoals = [...goalMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const funnelSteps = buildFunnelSteps(eventsPeriod);
  const biggestFunnelDrop =
    funnelSteps.length > 0
      ? funnelSteps.reduce((max, step) =>
          step.dropPercent > max.dropPercent ? step : max
        )
      : null;

  const ownerSummary = buildOwnerSummary({
    newUsers7d,
    activatedUsers7d,
    activationRate7d,
    topGoal: topGoals[0]?.label ?? null,
    topRecommendation: topRecommendations[0]?.title ?? null,
    biggestDrop: biggestFunnelDrop,
  });

  return {
    periodDays,
    overview: {
      totalUsers,
      newUsers7d,
      activatedUsers: activatedAll,
      activationRatePercent,
    },
    topRecommendations,
    lowRatedRecommendations,
    lowRatingReasons,
    topGoals,
    funnelSteps,
    biggestFunnelDrop,
    ownerSummary,
  };
}
