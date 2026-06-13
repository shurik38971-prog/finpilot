import { formatCurrency } from "@/lib/utils";
import {
  buildRescueProgressSnapshot,
  type BuildRescuePlanInput,
  type RescuePlan,
  type RescueProgressSnapshot,
} from "@/types/rescue-plan";
import type { RescuePlanOptionLike } from "@/types/rescue-plan";

function formatOptionIncomeRange(option: RescuePlanOptionLike): string | null {
  const min = option.income_min;
  const max = option.income_max;
  if (min > 0 && max > 0) {
    return `${min.toLocaleString("ru-RU")}–${max.toLocaleString("ru-RU")} ₽ / мес`;
  }
  if (option.expected_effect && option.expected_effect > 0) {
    const legacyMin = Math.round(option.expected_effect * 0.5);
    const legacyMax = Math.round(option.expected_effect * 1.5);
    return `${legacyMin.toLocaleString("ru-RU")}–${legacyMax.toLocaleString("ru-RU")} ₽ / мес`;
  }
  return null;
}

function formatPrimaryGoalDisplay(primaryGoal: string, totalDebt: number): string {
  if (primaryGoal === "Закрыть долги" && totalDebt > 0) {
    return `Закрыть долг ${formatCurrency(totalDebt)}`;
  }
  return primaryGoal;
}

function deriveMainProblem(
  escapePlan: BuildRescuePlanInput["escapePlan"],
  netCashFlow: number
): string {
  const fromAi = escapePlan.situation_summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .find(Boolean);

  if (fromAi && !/индекс|score|рейтинг/i.test(fromAi)) {
    return fromAi.replace(/\.$/, "");
  }

  if (netCashFlow < 0) {
    return "После обязательных расходов не хватает денег до конца месяца";
  }
  if (netCashFlow < 10_000) {
    return "После обязательных расходов почти не остаётся свободных денег";
  }
  return "Нужно быстрее нарастить запас или доход, чтобы двигаться к цели";
}

function buildCurrentSituation(
  monthlyIncome: number,
  netCashFlow: number,
  totalDebt: number
): string {
  const lines = [
    `Доход: ${formatCurrency(monthlyIncome)}`,
    `Свободный остаток: ${formatCurrency(netCashFlow)}`,
  ];
  if (totalDebt > 0) {
    lines.push(`Долг: ${formatCurrency(totalDebt)}`);
  }
  return lines.join("\n");
}

function buildExpectedResult(option: RescuePlanOptionLike | null | undefined): string {
  if (!option) {
    return "Дополнительные деньги или меньше расходов — ближе к вашей цели";
  }

  const range = formatOptionIncomeRange(option);
  if (option.type === "increase_income" && range) {
    return `Дополнительный доход ${range.replace(" / мес", "")} в месяц`;
  }
  if (option.type === "reduce_expenses" && range) {
    return `Освободить около ${range.replace(" / мес", "")} в месяц`;
  }
  if (range) {
    return `Эффект около ${range.replace(" / мес", "")} в месяц`;
  }
  return option.why_fits || "Первый результат приблизит к цели";
}

export function buildRescuePlan(input: BuildRescuePlanInput): RescuePlan {
  const {
    monthlyIncome,
    netCashFlow,
    totalDebt,
    primaryGoal,
    escapePlan,
    topOption = null,
    activePlan = null,
    pendingTasks = [],
  } = input;

  const recommendedPath =
    activePlan?.option_title ?? topOption?.title ?? escapePlan.main_strategy;

  const nextPendingTask = pendingTasks.find((t) => t.status === "pending");
  const nextAction =
    nextPendingTask?.title ??
    topOption?.first_step ??
    activePlan?.option_snapshot?.first_step ??
    "Выберите направление и сделайте первый шаг сегодня";

  const optionForResult = activePlan?.option_snapshot ?? topOption;

  return {
    currentSituation: buildCurrentSituation(
      monthlyIncome,
      netCashFlow,
      totalDebt
    ),
    mainProblem: deriveMainProblem(escapePlan, netCashFlow),
    monthlyGap: Math.max(escapePlan.needed_amount, 0),
    primaryGoal: formatPrimaryGoalDisplay(primaryGoal, totalDebt),
    recommendedPath,
    nextAction,
    expectedResult: buildExpectedResult(optionForResult),
  };
}

export function buildRescueProgressFromPlan(
  rescuePlan: RescuePlan,
  incomeFound: number
): RescueProgressSnapshot {
  return buildRescueProgressSnapshot(rescuePlan, incomeFound);
}
