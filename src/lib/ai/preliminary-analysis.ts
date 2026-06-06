import type { AnalysisDataMaturity } from "@/lib/finance/analysis-data-maturity";
import type { AiAnalysisResult, NextBestAction } from "@/types/analysis";
import { isForbiddenRecommendation, type AnalysisDataFlags } from "@/lib/ai/analysis-guardrails";

const PRELIMINARY_FORBIDDEN_PATTERNS = [
  /подработк/i,
  /дополнительн\w*\s+доход/i,
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

function pickPreliminaryNextStep(
  maturity: AnalysisDataMaturity
): NextBestAction {
  if (maturity.operationCount < 5) {
    return {
      title: "Добавьте реальные доходы и расходы за текущий месяц",
      description:
        "Пока в системе только примерные данные из регистрации. Реальные операции помогут точнее оценить ситуацию.",
      impact_score: 60,
      impact_label: "Заметно поможет",
      due_days: 7,
    };
  }

  return {
    title: "Продолжайте вести учёт финансов для повышения точности анализа",
    description:
      "Чем больше реальных доходов и расходов вы фиксируете, тем точнее станут рекомендации FinPilot.",
    impact_score: 55,
    impact_label: "Немного поможет",
    due_days: 14,
  };
}

const SOFT_ACTIONS = [
  {
    priority: "medium" as const,
    action: "Следите за расходами в течение месяца",
    effect: "Поможет увидеть реальную картину трат, а не только примерные суммы.",
  },
  {
    priority: "medium" as const,
    action: "Регулярно фиксируйте доходы",
    effect: "Особенно важно при нестабильном доходе — так прогноз станет точнее.",
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
    "По примерным данным из регистрации видна общая картина доходов и расходов.";

  if (matchesPreliminaryForbidden(base)) {
    return "Это предварительная оценка на основе данных, которые вы указали при регистрации. Точность вырастет, когда появится реальная история операций.";
  }

  return `${base} Это предварительная оценка — рекомендации станут точнее после накопления реальной финансовой истории.`;
}

function softenThreat(threat: string | undefined): string {
  if (!threat || matchesPreliminaryForbidden(threat)) {
    return "Пока в системе мало реальных данных, поэтому выводы носят ориентировочный характер. Сфокусируйтесь на учёте доходов и расходов в ближайшие недели.";
  }

  return `${threat} Пока это предварительная оценка — не стоит воспринимать её как срочную директиву.`;
}

export function applyPreliminaryAnalysis(
  parsed: AiAnalysisResult,
  maturity: AnalysisDataMaturity,
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
    nextBest = pickPreliminaryNextStep(maturity);
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
      "Оценка построена на примерных данных. Для точных выводов нужна история реальных операций.",
    main_threat: softenThreat(parsed.main_threat),
    money_leaks: moneyLeaks,
    plan_7_days:
      plan7.length > 0
        ? plan7
        : [
            {
              action: "Добавьте реальные финансовые операции за текущий месяц",
              why: "Это главный шаг для перехода от предварительной оценки к точному анализу.",
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
    title: "Добавьте реальные доходы за текущий месяц",
    description:
      "Отметьте фактические поступления — так FinPilot перейдёт от примерной оценки к анализу по реальным данным.",
  },
  {
    title: "Отметьте расходы за текущий месяц",
    description:
      "Зафиксируйте все траты, включая мелкие — это повысит точность рекомендаций.",
  },
  {
    title: "Продолжайте вести учёт финансов",
    description:
      "Регулярные записи в течение 3–4 недель заметно улучшают качество анализа.",
  },
] as const;
