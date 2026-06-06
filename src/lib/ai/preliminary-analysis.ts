import type { AnalysisDataMaturity } from "@/lib/finance/analysis-data-maturity";
import type { AiAnalysisResult, NextBestAction } from "@/types/analysis";
import {
  isForbiddenRecommendation,
  type AnalysisDataFlags,
} from "@/lib/ai/analysis-guardrails";

const PRELIMINARY_FORBIDDEN_PATTERNS = [
  /подработк/i,
  /увелич\w*\s+доход/i,
  /срочно.*доход/i,
  /найти.*доход/i,
  /на\s+[\d\s]+\s*₽/i,
  /на\s+[\d\s]+\s*руб/i,
  /\d+\s*000\s*₽/i,
  /кредит/i,
  /займ/i,
  /рефинанс/i,
  /микрозайм/i,
  /заказчик/i,
  /клиент/i,
  /работодател/i,
  /сч[её]т/i,
  /просроч/i,
  /добавьте\s+реальн/i,
  /реальные\s+доходы/i,
  /реальные\s+финансовые\s+операции/i,
  /зарплат\w*\s+не\s+получен/i,
];

function matchesPreliminaryForbidden(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return PRELIMINARY_FORBIDDEN_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );
}

export function isPreliminaryForbiddenRecommendation(text: string): boolean {
  return matchesPreliminaryForbidden(text);
}

function pickPreliminaryNextStep(): NextBestAction {
  return {
    title: "Продолжайте вести учёт финансов для повышения точности анализа",
    description:
      "Данные из регистрации уже учтены. Добавляйте новые доходы и расходы по мере их появления — так прогноз станет точнее.",
    impact_score: 55,
    impact_label: "Немного поможет",
    due_days: 14,
  };
}

const SOFT_ACTIONS = [
  {
    priority: "medium" as const,
    action: "Следите за расходами в течение месяца",
    effect: "Поможет сравнить план из регистрации с реальными тратами.",
  },
  {
    priority: "medium" as const,
    action: "Добавляйте новые доходы и расходы по мере их появления",
    effect: "FinPilot постепенно перейдёт от данных регистрации к вашей истории.",
  },
  {
    priority: "low" as const,
    action: "Начните формировать подушку безопасности",
    effect: "Даже небольшие отложения снижают стресс при непредвиденных тратах.",
  },
  {
    priority: "low" as const,
    action: "Отмечайте обязательные платежи",
    effect: "Так FinPilot лучше поймёт, сколько денег уходит на базовые нужды.",
  },
];

function softenSummary(summary: string | undefined): string {
  const base =
    summary?.trim() ||
    "По данным из регистрации видна общая картина доходов и расходов.";

  if (matchesPreliminaryForbidden(base)) {
    return "Это предварительная оценка на основе данных, которые вы указали при регистрации. FinPilot уже использует их в расчётах.";
  }

  return `${base} Это предварительная оценка на данных регистрации — точность вырастет по мере ведения учёта.`;
}

function softenThreat(threat: string | undefined): string {
  if (!threat || matchesPreliminaryForbidden(threat)) {
    return "На основе введённых при регистрации данных можно увидеть общую картину. Для более точных выводов продолжайте фиксировать новые операции.";
  }

  return `${threat} Это ориентир по данным регистрации, а не срочная директива.`;
}

export function applyPreliminaryAnalysis(
  parsed: AiAnalysisResult,
  _maturity: AnalysisDataMaturity,
  flags: AnalysisDataFlags
): AiAnalysisResult {
  const filterText = (text: string) =>
    !isForbiddenRecommendation(text, flags) &&
    !isPreliminaryForbiddenRecommendation(text);

  const moneyLeaks = (parsed.money_leaks ?? []).filter(filterText);
  const plan7 = (parsed.plan_7_days ?? [])
    .filter(
      (item) => filterText(item.action) && filterText(item.why ?? "")
    )
    .slice(0, 2);
  const plan30 = (parsed.plan_30_days ?? [])
    .filter(
      (item) => filterText(item.action) && filterText(item.why ?? "")
    )
    .slice(0, 2);

  const actions30 = SOFT_ACTIONS.filter(
    (item) => filterText(item.action) && filterText(item.effect)
  ).slice(0, 3);

  let nextBest = parsed.next_best_action;
  if (
    !nextBest?.title?.trim() ||
    !filterText(nextBest.title) ||
    !filterText(nextBest.description ?? "")
  ) {
    nextBest = pickPreliminaryNextStep();
  } else {
    nextBest = {
      ...nextBest,
      impact_score: Math.min(nextBest.impact_score ?? 60, 65),
      impact_label: "Заметно поможет",
    };
  }

  return {
    ...parsed,
    summary: softenSummary(parsed.summary),
    health_explanation:
      parsed.health_explanation?.trim() ||
      "Оценка построена на данных, которые вы указали при регистрации.",
    main_threat: softenThreat(parsed.main_threat),
    money_leaks: moneyLeaks,
    plan_7_days:
      plan7.length > 0
        ? plan7
        : [
            {
              action:
                "Продолжайте вести учёт финансов для повышения точности анализа",
              why: "Данные регистрации уже учтены — новые операции сделают прогноз точнее.",
            },
          ],
    plan_30_days: plan30,
    plan_90_days: [],
    actions_30_days: actions30,
    next_best_action: nextBest,
    debt_recommendation: undefined,
    risks: (parsed.risks ?? []).filter(
      (risk) =>
        filterText(risk.title) && filterText(risk.description ?? "")
    ),
    cash_gap_risk: parsed.cash_gap_risk
      ? {
          ...parsed.cash_gap_risk,
          level:
            parsed.cash_gap_risk.level === "high"
              ? "medium"
              : parsed.cash_gap_risk.level,
          description: softenThreat(parsed.cash_gap_risk.description),
        }
      : parsed.cash_gap_risk,
  };
}

export const PRELIMINARY_SOFT_TASKS = [
  {
    title: "Продолжайте вести учёт финансов",
    description:
      "Данные из регистрации уже учтены. Добавляйте новые доходы и расходы по мере их появления.",
  },
  {
    title: "Следите за расходами в течение месяца",
    description:
      "Сравните плановые траты из регистрации с тем, что происходит на самом деле.",
  },
] as const;
