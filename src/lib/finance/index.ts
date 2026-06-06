import type { Debt, Expense, Income } from "@/types/database";
import {
  actualIncomeInMonth,
  expectedIncomeInMonth,
  incomeForHealthIndex,
} from "@/lib/finance/income-model";
import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";
import { PROFILE_INDEX_WEIGHTS } from "@/lib/profile/financial-profile";
import {
  DEFAULT_PROFILE_TYPE,
  type ProfileType,
} from "@/types/profile";
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
  month: Date = new Date()
): number {
  if (maxPoints <= 0) return 0;

  const expected = expectedIncomeInMonth(incomes, month);
  const actual = actualIncomeInMonth(incomes, month);

  if (expected > 0) {
    const ratio = Math.min(1.2, actual / expected);
    return Math.min(maxPoints, Math.max(0, ratio * maxPoints));
  }

  const avg = incomeForHealthIndex(incomes, month);
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
  profileType: ProfileType = DEFAULT_PROFILE_TYPE
): number | null {
  if (!hasFinancialData(incomes, expenses, debts)) {
    return null;
  }

  const weights = PROFILE_INDEX_WEIGHTS[profileType];
  const summary = getMonthlyFinanceSummary(incomes, expenses, debts);
  const monthlyIncome = incomeForHealthIndex(incomes);
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

  const uniqueSources = new Set(incomes.map((i) => i.category)).size;
  score += Math.min(weights.diversity, uniqueSources * (weights.diversity / 3));

  score += incomeStabilityScore(incomes, weights.stability);

  return Math.round(Math.min(100, Math.max(0, score)));
}

export interface DashboardSummary {
  totalIncome: number;
  expectedIncome: number;
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
  profileType: ProfileType = DEFAULT_PROFILE_TYPE
): DashboardSummary {
  const summary = getMonthlyFinanceSummary(incomes, expenses, debts);
  const financialIndex = calculateFinancialIndex(
    incomes,
    expenses,
    debts,
    profileType
  );

  return {
    totalIncome: summary.totalIncome,
    expectedIncome: summary.expectedIncome,
    incomeComparison: summary.incomeComparison,
    averageActualIncome3Months: summary.averageActualIncome3Months,
    totalExpenses: summary.totalExpenses,
    debtPayments: summary.debtPayments,
    netCashFlow: summary.freeMoney,
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
