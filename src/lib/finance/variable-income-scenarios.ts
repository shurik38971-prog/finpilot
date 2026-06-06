import { actualIncomeInMonth } from "@/lib/finance/income-model";
import { filterOperationalIncomes } from "@/lib/finance/operational-incomes";
import { formatCurrency } from "@/lib/utils";
import type { ForecastScenario } from "@/lib/finance/forecast-profile-income";
import type { Income } from "@/types/database";
import {
  deriveBaseIncomeFromProfile,
  type ProfileIncomeParameters,
} from "@/types/profile-income";
import { startOfMonth, subMonths } from "date-fns";

export interface VariableIncomeScenarios {
  bad: number;
  base: number;
  good: number;
  source: "history" | "profile";
  basisLabel: string;
}

/** Last 3 completed calendar months; all must have actual income > 0. */
export function actualIncomeLastThreeMonthsStats(
  incomes: Income[],
  from: Date = new Date()
): Pick<VariableIncomeScenarios, "bad" | "base" | "good"> | null {
  const operational = filterOperationalIncomes(incomes);
  const totals = [1, 2, 3].map((offset) =>
    actualIncomeInMonth(operational, startOfMonth(subMonths(from, offset)))
  );

  if (totals.filter((total) => total > 0).length < 3) {
    return null;
  }

  const bad = Math.min(...totals);
  const good = Math.max(...totals);
  const base = Math.round(totals.reduce((sum, total) => sum + total, 0) / 3);

  return { bad, base, good };
}

export function resolveVariableIncomeScenarios(
  incomes: Income[],
  profileIncome: ProfileIncomeParameters | null,
  from: Date = new Date()
): VariableIncomeScenarios | null {
  const fromHistory = actualIncomeLastThreeMonthsStats(incomes, from);
  if (fromHistory) {
    return {
      ...fromHistory,
      source: "history",
      basisLabel:
        "На основании ваших доходов за последние 3 месяца. История важнее ручных настроек.",
    };
  }

  const bad = profileIncome?.badMonth ?? 0;
  const good = profileIncome?.goodMonth ?? 0;
  if (bad <= 0 || good <= 0 || good < bad) {
    return null;
  }

  const base = deriveBaseIncomeFromProfile({ averageMonthly: null, badMonth: bad, goodMonth: good })!;

  return {
    bad,
    base,
    good,
    source: "profile",
    basisLabel: `Плохой сценарий: ${formatCurrency(bad)}/мес · базовый: ${formatCurrency(base)}/мес · хороший: ${formatCurrency(good)}/мес`,
  };
}

export function toForecastScenarios(
  scenarios: VariableIncomeScenarios
): ForecastScenario[] {
  return [
    { label: "Плохой сценарий", monthlyIncome: scenarios.bad },
    { label: "Базовый сценарий", monthlyIncome: scenarios.base },
    { label: "Хороший сценарий", monthlyIncome: scenarios.good },
  ];
}

export function scenarioIncomeByLabel(
  scenarios: ForecastScenario[] | undefined,
  kind: "bad" | "base" | "good"
): number | undefined {
  if (!scenarios?.length) return undefined;

  const matchers: Record<typeof kind, string[]> = {
    bad: ["Плохой сценарий", "Плохой", "Консервативный"],
    base: ["Базовый сценарий", "Базовый"],
    good: ["Хороший сценарий", "Хороший", "Оптимистичный"],
  };

  return scenarios.find((item) => matchers[kind].includes(item.label))
    ?.monthlyIncome;
}

export function getExpectedMonthlyIncome(
  params: ProfileIncomeParameters | null | undefined,
  incomes?: Income[],
  from?: Date
): number | null {
  if (incomes) {
    const scenarios = resolveVariableIncomeScenarios(incomes, params ?? null, from);
    if (scenarios) return scenarios.base;
  }

  return deriveBaseIncomeFromProfile(params) ?? params?.averageMonthly ?? null;
}

export function getIncomeGap(
  actualCurrentMonth: number,
  params: ProfileIncomeParameters | null | undefined,
  incomes?: Income[],
  from?: Date
): number | null {
  const expected = getExpectedMonthlyIncome(params, incomes, from);
  if (expected === null) return null;
  return expected - actualCurrentMonth;
}

export function getVariableIncomeComparisonLabel(
  actualCurrentMonth: number,
  params: ProfileIncomeParameters | null | undefined,
  incomes?: Income[],
  from?: Date
): string | null {
  const expected = getExpectedMonthlyIncome(params, incomes, from);
  if (expected === null || expected <= 0) return null;
  if (actualCurrentMonth > expected) return "Доход выше обычного месяца";
  if (actualCurrentMonth < expected) return "Доход ниже обычного месяца";
  return null;
}

export function toAnalysisIncomeFields(
  params: ProfileIncomeParameters | null | undefined,
  actualCurrentMonth: number,
  incomes?: Income[],
  from?: Date
) {
  const scenarios = incomes
    ? resolveVariableIncomeScenarios(incomes, params ?? null, from)
    : null;
  const base =
    scenarios?.base ?? deriveBaseIncomeFromProfile(params) ?? params?.averageMonthly ?? null;
  const gap = base !== null ? base - actualCurrentMonth : null;

  return {
    bad_month_income: scenarios?.bad ?? params?.badMonth ?? null,
    average_month_income: base,
    good_month_income: scenarios?.good ?? params?.goodMonth ?? null,
    expected_monthly_income: base,
    actual_income_current_month: actualCurrentMonth,
    income_gap: gap,
    income_scenario_source: scenarios?.source ?? null,
  };
}
