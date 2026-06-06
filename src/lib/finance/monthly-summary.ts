import type { Debt, Expense, Income } from "@/types/database";
import { toMonthlyAmount } from "@/lib/utils";
import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";

export interface MonthlyFinanceSummary {
  totalIncome: number;
  recurringIncome: number;
  oneTimeIncome: number;
  totalExpenses: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
  debtPayments: number;
  freeMoney: number;
  totalDebt: number;
}

function recurringIncomeTotal(incomes: Income[]): number {
  return incomes
    .filter((income) => income.is_recurring)
    .reduce(
      (sum, income) =>
        sum + toMonthlyAmount(income.amount, income.frequency, true),
      0
    );
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

export function isDateInMonth(dateStr: string, month: Date): boolean {
  const date = parseISO(dateStr);
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return isWithinInterval(date, { start, end });
}

export function oneTimeIncomeInMonth(
  incomes: Income[],
  month: Date
): number {
  return incomes
    .filter((income) => !income.is_recurring && isDateInMonth(income.date, month))
    .reduce((sum, income) => sum + income.amount, 0);
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

export function getMonthlyFinanceSummary(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  month: Date = new Date()
): MonthlyFinanceSummary {
  const targetMonth = normalizeMonth(month);

  const recurringIncome = recurringIncomeTotal(incomes);
  const recurringExpenses = recurringExpenseTotal(expenses);
  const oneTimeIncome = oneTimeIncomeInMonth(incomes, targetMonth);
  const oneTimeExpenses = oneTimeExpenseInMonth(expenses, targetMonth);
  const debtPayments = debtPaymentsTotal(debts);
  const totalDebt = debtRemainingTotal(debts);

  const totalIncome = recurringIncome + oneTimeIncome;
  const totalExpenses = recurringExpenses + oneTimeExpenses;
  const freeMoney = totalIncome - totalExpenses - debtPayments;

  return {
    totalIncome: Math.round(totalIncome),
    recurringIncome: Math.round(recurringIncome),
    oneTimeIncome: Math.round(oneTimeIncome),
    totalExpenses: Math.round(totalExpenses),
    recurringExpenses: Math.round(recurringExpenses),
    oneTimeExpenses: Math.round(oneTimeExpenses),
    debtPayments: Math.round(debtPayments),
    freeMoney: Math.round(freeMoney),
    totalDebt: Math.round(totalDebt),
  };
}
