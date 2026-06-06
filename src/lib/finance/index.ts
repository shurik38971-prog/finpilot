import type { Debt, Expense, Income } from "@/types/database";
import {
  actualIncomeInMonth,
  expectedIncomeInMonth,
  getIncomeComparisonMessage,
  incomeForHealthIndex,
} from "@/lib/finance/income-model";
import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";
import { PROFILE_INDEX_WEIGHTS } from "@/lib/profile/financial-profile";
import {
  resolvePlanningMonthlyIncome,
  resolveProfileExpectedIncome,
} from "@/lib/finance/profile-expected-income";
import { getVariableIncomeComparisonLabel } from "@/lib/finance/variable-income-scenarios";
import {
  hasAnyProfileIncomeExpectation,
  type ProfileIncomeParameters,
} from "@/types/profile-income";
import { usesVariableIncome } from "@/types/profile";
import {
  DEFAULT_PROFILE_TYPE,
  type ProfileType,
} from "@/types/profile";
import { filterOperationalIncomes } from "@/lib/finance/operational-incomes";
import { toMonthlyAmount } from "@/lib/utils";

export {
  actualIncomeInMonth,
  averageActualInMonthsWithData,
  averageActualIncomeLastMonths,
  countIncomesByType,
  expectedIncomeInMonth,
  getIncomeComparisonMessage,
  incomeForHealthIndex,
  resolveForecastMonthlyIncome,
  resolveIncomeType,
  type ActualIncomeAverage,
} from "@/lib/finance/income-model";

export {
  FORECAST_INSUFFICIENT_MESSAGE,
  resolveProfileForecastIncome,
  type ForecastIncomeModel,
  type ForecastScenario,
} from "@/lib/finance/forecast-profile-income";

export {
  getMonthlyFinanceSummary,
  isDateInMonth,
  oneTimeExpenseInMonth,
  oneTimeIncomeInMonth,
  type MonthlyFinanceSummary,
} from "@/lib/finance/monthly-summary";

export { forecastCashFlow, type ForecastCashFlowResult } from "@/lib/finance/forecast";

export {
  getExpectedMonthlyIncome,
  getIncomeGap,
  getVariableIncomeComparisonLabel,
  resolveVariableIncomeScenarios,
  toAnalysisIncomeFields,
} from "@/lib/finance/variable-income-scenarios";

export {
  recurringExpectedMonthlyTotal,
  resolvePlanningMonthlyIncome,
  resolveProfileExpectedIncome,
} from "@/lib/finance/profile-expected-income";

export function monthlyIncomeTotal(incomes: Income[]): number {
  return getMonthlyFinanceSummary(incomes, [], []).totalIncome;
}

export function monthlyExpenseTotal(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.is_recurring)
    .reduce(
      (sum, e) => sum + toMonthlyAmount(e.amount, e.frequency, true),
      0
    );
}

export function totalDebtRemaining(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.remaining_amount, 0);
}

export function monthlyDebtPayments(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + d.minimum_payment, 0);
}

export function hasFinancialData(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[]
): boolean {
  return incomes.length > 0 || expenses.length > 0 || debts.length > 0;
}

/**
 * Financial Health Index (0–100) for self-employed with unstable income.
 * Returns null when there is no income, expense, or debt data to analyze.
 *
 * Components:
 * - Cash flow ratio (30%): net / income
 * - Debt burden (25%): inverse of debt-to-income
 * - Savings buffer (20%): months of expenses covered
 * - Essential expense ratio (15%): non-essential headroom
 * - Income diversity (10%): number of income sources
 */
function incomeStabilityScore(
  incomes: Income[],
  maxPoints: number,
  month: Date = new Date(),
  profileExpectedMonthly: number | null = null
): number {
  if (maxPoints <= 0) return 0;

  const operationalIncomes = filterOperationalIncomes(incomes);
  const expected =
    profileExpectedMonthly ?? expectedIncomeInMonth(operationalIncomes, month);
  const actual = actualIncomeInMonth(operationalIncomes, month);

  if (expected > 0) {
    const ratio = Math.min(1.2, actual / expected);
    return Math.min(maxPoints, Math.max(0, ratio * maxPoints));
  }

  const avg = incomeForHealthIndex(operationalIncomes, month);
  if (avg > 0 && actual > 0) {
    const ratio = Math.min(1.2, actual / avg);
    return Math.min(maxPoints, Math.max(0, ratio * maxPoints));
  }

  return Math.round(maxPoints * 0.4);
}

export function calculateFinancialIndex(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): number | null {
  const operationalIncomes = filterOperationalIncomes(incomes);

  const profileExpected = resolveProfileExpectedIncome(
    profileType,
    operationalIncomes,
    profileIncome
  );

  if (!hasFinancialData(operationalIncomes, expenses, debts)) {
    if (!profileExpected && !hasAnyProfileIncomeExpectation(profileIncome)) {
      return null;
    }
  }

  const weights = PROFILE_INDEX_WEIGHTS[profileType];
  const summary = getMonthlyFinanceSummary(operationalIncomes, expenses, debts);
  const monthlyIncome =
    resolvePlanningMonthlyIncome(
      summary.totalIncome,
      profileType,
      operationalIncomes,
      profileIncome
    ) || incomeForHealthIndex(operationalIncomes);
  const monthlyExpenses = summary.totalExpenses;
  const debtPayments = summary.debtPayments;
  const totalDebt = summary.totalDebt;
  const netCashFlow = monthlyIncome - monthlyExpenses - debtPayments;

  let score = 0;

  if (monthlyIncome > 0) {
    const cashFlowRatio = netCashFlow / monthlyIncome;
    score += Math.min(
      weights.cashFlow,
      Math.max(0, (cashFlowRatio + 0.2) * (weights.cashFlow / 0.6))
    );
  }

  if (monthlyIncome > 0) {
    const dti = (debtPayments + totalDebt * 0.02) / monthlyIncome;
    score += Math.min(
      weights.debt,
      Math.max(0, weights.debt - dti * (weights.debt * 1.6))
    );
  } else if (totalDebt === 0) {
    score += weights.debt;
  }

  if (monthlyExpenses + debtPayments > 0) {
    const bufferMonths = netCashFlow / (monthlyExpenses + debtPayments);
    score += Math.min(
      weights.buffer,
      Math.max(0, bufferMonths * (weights.buffer / 2))
    );
  } else {
    score += weights.buffer;
  }

  const essential = expenses
    .filter((e) => e.is_essential && e.is_recurring)
    .reduce(
      (sum, e) => sum + toMonthlyAmount(e.amount, e.frequency, true),
      0
    );
  if (monthlyIncome > 0) {
    const essentialRatio = essential / monthlyIncome;
    score += Math.min(
      weights.essential,
      Math.max(0, weights.essential - essentialRatio * (weights.essential * 1.3))
    );
  } else {
    score += Math.round(weights.essential * 0.45);
  }

  const uniqueSources = new Set(operationalIncomes.map((i) => i.category)).size;
  score += Math.min(weights.diversity, uniqueSources * (weights.diversity / 3));

  score += incomeStabilityScore(
    operationalIncomes,
    weights.stability,
    new Date(),
    profileExpected
  );

  return Math.round(Math.min(100, Math.max(0, score)));
}

export interface DashboardSummary {
  /** Actual income received in the current month. */
  totalIncome: number;
  /** Profile-aware expected income (salary, pension, base scenario, etc.). */
  expectedIncome: number;
  /** Shown on dashboard when actual month is still empty. */
  displayIncome: number;
  incomeComparison: string | null;
  averageActualIncome3Months: number | null;
  totalExpenses: number;
  debtPayments: number;
  netCashFlow: number;
  totalDebt: number;
  financialIndex: number | null;
}

/** Сводка дашборда: фактические доходы и расходы текущего месяца. */
export function computeDashboardSummary(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): DashboardSummary {
  const operationalIncomes = filterOperationalIncomes(incomes);
  const summary = getMonthlyFinanceSummary(operationalIncomes, expenses, debts);
  const financialIndex = calculateFinancialIndex(
    operationalIncomes,
    expenses,
    debts,
    profileType,
    profileIncome
  );

  const profileExpected =
    resolveProfileExpectedIncome(
      profileType,
      operationalIncomes,
      profileIncome
    ) ?? 0;
  const expectedIncome = profileExpected || summary.expectedIncome;
  const planningIncome = resolvePlanningMonthlyIncome(
    summary.totalIncome,
    profileType,
    operationalIncomes,
    profileIncome
  );
  const incomeComparison = usesVariableIncome(profileType)
    ? getVariableIncomeComparisonLabel(
        summary.totalIncome,
        profileIncome,
        operationalIncomes
      )
    : getIncomeComparisonMessage(summary.totalIncome, expectedIncome);

  return {
    totalIncome: summary.totalIncome,
    expectedIncome,
    displayIncome: planningIncome,
    incomeComparison,
    averageActualIncome3Months: summary.averageActualIncome3Months,
    totalExpenses: summary.totalExpenses,
    debtPayments: summary.debtPayments,
    netCashFlow:
      planningIncome - summary.totalExpenses - summary.debtPayments,
    totalDebt: summary.totalDebt,
    financialIndex,
  };
}

export function getIndexLabel(index: number): {
  label: string;
  color: string;
} {
  if (index >= 80) return { label: "Отлично", color: "text-emerald-400" };
  if (index >= 60) return { label: "Хорошо", color: "text-green-400" };
  if (index >= 40) return { label: "Средне", color: "text-yellow-400" };
  if (index >= 20) return { label: "Риск", color: "text-orange-400" };
  return { label: "Критично", color: "text-red-400" };
}
