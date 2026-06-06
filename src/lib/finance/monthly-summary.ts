import type { Debt, Expense, Income } from "@/types/database";
import {
  actualIncomeInMonth,
  averageActualIncomeLastMonths,
  expectedIncomeInMonth,
  getIncomeComparisonMessage,
} from "@/lib/finance/income-model";
import { toMonthlyAmount } from "@/lib/utils";
import { isDateInMonth } from "@/lib/finance/date-utils";
import { startOfMonth } from "date-fns";

export { isDateInMonth } from "@/lib/finance/date-utils";

export interface MonthlyFinanceSummary {
  totalIncome: number;
  actualIncome: number;
  expectedIncome: number;
  incomeComparison: string | null;
  averageActualIncome3Months: number | null;
  totalExpenses: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
  debtPayments: number;
  freeMoney: number;
  totalDebt: number;
}

function recurringExpenseTotal(expenses: Expense[]): number {
  return expenses
    .filter((expense) => expense.is_recurring)
    .reduce(
      (sum, expense) =>
        sum + toMonthlyAmount(expense.amount, expense.frequency, true),
      0
    );
}

function debtPaymentsTotal(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.minimum_payment, 0);
}

function debtRemainingTotal(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
}

function normalizeMonth(month: Date): Date {
  return startOfMonth(month);
}

export function oneTimeExpenseInMonth(
  expenses: Expense[],
  month: Date
): number {
  return expenses
    .filter(
      (expense) =>
        !expense.is_recurring && isDateInMonth(expense.date, month)
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/** @deprecated use actualIncomeInMonth from income-model */
export function oneTimeIncomeInMonth(
  incomes: Income[],
  month: Date
): number {
  return actualIncomeInMonth(incomes, month);
}

export function getMonthlyFinanceSummary(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  month: Date = new Date()
): MonthlyFinanceSummary {
  const targetMonth = normalizeMonth(month);

  const actualIncome = actualIncomeInMonth(incomes, targetMonth);
  const expectedIncome = expectedIncomeInMonth(incomes, targetMonth);
  const recurringExpenses = recurringExpenseTotal(expenses);
  const oneTimeExpenses = oneTimeExpenseInMonth(expenses, targetMonth);
  const debtPayments = debtPaymentsTotal(debts);
  const totalDebt = debtRemainingTotal(debts);
  const averageActualIncome3Months = averageActualIncomeLastMonths(
    incomes,
    3,
    targetMonth
  );

  const totalExpenses = recurringExpenses + oneTimeExpenses;
  const freeMoney = actualIncome - totalExpenses - debtPayments;

  return {
    totalIncome: Math.round(actualIncome),
    actualIncome: Math.round(actualIncome),
    expectedIncome: Math.round(expectedIncome),
    incomeComparison: getIncomeComparisonMessage(actualIncome, expectedIncome),
    averageActualIncome3Months:
      averageActualIncome3Months === null
        ? null
        : Math.round(averageActualIncome3Months),
    totalExpenses: Math.round(totalExpenses),
    recurringExpenses: Math.round(recurringExpenses),
    oneTimeExpenses: Math.round(oneTimeExpenses),
    debtPayments: Math.round(debtPayments),
    freeMoney: Math.round(freeMoney),
    totalDebt: Math.round(totalDebt),
  };
}
