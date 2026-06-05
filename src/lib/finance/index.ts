import type { Debt, Expense, Income } from "@/types/database";
import { toMonthlyAmount } from "@/lib/utils";

export function monthlyIncomeTotal(incomes: Income[]): number {
  return incomes
    .filter((i) => i.is_recurring)
    .reduce(
      (sum, i) => sum + toMonthlyAmount(i.amount, i.frequency, true),
      0
    );
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
export function calculateFinancialIndex(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[]
): number | null {
  if (!hasFinancialData(incomes, expenses, debts)) {
    return null;
  }

  const monthlyIncome = monthlyIncomeTotal(incomes);
  const monthlyExpenses = monthlyExpenseTotal(expenses);
  const debtPayments = monthlyDebtPayments(debts);
  const totalDebt = totalDebtRemaining(debts);
  const netCashFlow = monthlyIncome - monthlyExpenses - debtPayments;

  let score = 0;

  // Cash flow (30 pts)
  if (monthlyIncome > 0) {
    const cashFlowRatio = netCashFlow / monthlyIncome;
    score += Math.min(30, Math.max(0, (cashFlowRatio + 0.2) * 50));
  }

  // Debt burden (25 pts)
  if (monthlyIncome > 0) {
    const dti = (debtPayments + totalDebt * 0.02) / monthlyIncome;
    score += Math.min(25, Math.max(0, 25 - dti * 40));
  } else if (totalDebt === 0) {
    score += 25;
  }

  // Savings buffer (20 pts) — months of expenses net can cover
  if (monthlyExpenses + debtPayments > 0) {
    const bufferMonths = netCashFlow / (monthlyExpenses + debtPayments);
    score += Math.min(20, Math.max(0, bufferMonths * 10));
  } else {
    score += 20;
  }

  // Essential expense ratio (15 pts) — recurring essential only
  const essential = expenses
    .filter((e) => e.is_essential && e.is_recurring)
    .reduce(
      (sum, e) => sum + toMonthlyAmount(e.amount, e.frequency, true),
      0
    );
  if (monthlyIncome > 0) {
    const essentialRatio = essential / monthlyIncome;
    score += Math.min(15, Math.max(0, 15 - essentialRatio * 20));
  } else {
    score += 7;
  }

  // Income diversity (10 pts)
  const uniqueSources = new Set(incomes.map((i) => i.category)).size;
  score += Math.min(10, uniqueSources * 3);

  return Math.round(Math.min(100, Math.max(0, score)));
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  debtPayments: number;
  netCashFlow: number;
  totalDebt: number;
  financialIndex: number | null;
}

/** Сводка дашборда: регулярные доходы/расходы, платежи по долгам, чистый поток. */
export function computeDashboardSummary(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[]
): DashboardSummary {
  const totalIncome = Math.round(monthlyIncomeTotal(incomes));
  const totalExpenses = Math.round(monthlyExpenseTotal(expenses));
  const debtPayments = Math.round(monthlyDebtPayments(debts));
  const netCashFlow = totalIncome - totalExpenses - debtPayments;
  const totalDebt = Math.round(totalDebtRemaining(debts));
  const financialIndex = calculateFinancialIndex(incomes, expenses, debts);

  return {
    totalIncome,
    totalExpenses,
    debtPayments,
    netCashFlow,
    totalDebt,
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
