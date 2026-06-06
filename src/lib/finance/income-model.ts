import type { Income } from "@/types/database";
import type { IncomeType } from "@/types/database";
import { toMonthlyAmount } from "@/lib/utils";
import { isDateInMonth } from "@/lib/finance/date-utils";
import { startOfMonth, subMonths } from "date-fns";

export function resolveIncomeType(income: Income): IncomeType {
  if (income.income_type === "expected" || income.income_type === "actual") {
    return income.income_type;
  }

  return income.is_recurring ? "expected" : "actual";
}

export function expectedIncomeAmount(income: Income): number {
  if (resolveIncomeType(income) !== "expected") return 0;

  if (income.is_recurring && income.frequency) {
    return toMonthlyAmount(income.amount, income.frequency, true);
  }

  return income.amount;
}

export function actualIncomeInMonth(
  incomes: Income[],
  month: Date
): number {
  return incomes
    .filter(
      (income) =>
        resolveIncomeType(income) === "actual" &&
        isDateInMonth(income.date, month)
    )
    .reduce((sum, income) => sum + income.amount, 0);
}

export function expectedIncomeInMonth(
  incomes: Income[],
  month: Date
): number {
  return incomes
    .filter(
      (income) =>
        resolveIncomeType(income) === "expected" &&
        isDateInMonth(income.date, month)
    )
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);
}

export function averageActualIncomeLastMonths(
  incomes: Income[],
  months = 3,
  from: Date = new Date()
): number | null {
  const hasActual = incomes.some(
    (income) => resolveIncomeType(income) === "actual"
  );
  if (!hasActual) return null;

  let total = 0;
  for (let m = 0; m < months; m += 1) {
    total += actualIncomeInMonth(incomes, startOfMonth(subMonths(from, m)));
  }

  return total / months;
}

export function getIncomeComparisonMessage(
  actual: number,
  expected: number
): string | null {
  if (expected <= 0) return null;
  if (actual < expected) return "Доход ниже ожидаемого";
  if (actual > expected) return "Доход выше ожидаемого";
  return null;
}

export function incomeForHealthIndex(
  incomes: Income[],
  month: Date = new Date()
): number {
  const actual = actualIncomeInMonth(incomes, month);
  if (actual > 0) return actual;

  return averageActualIncomeLastMonths(incomes, 3, month) ?? 0;
}

export function resolveForecastMonthlyIncome(
  incomes: Income[],
  month: Date = new Date()
): number | null {
  const averageActual = averageActualIncomeLastMonths(incomes, 3, month);
  if (averageActual !== null && averageActual > 0) {
    return averageActual;
  }

  const expected = expectedIncomeInMonth(incomes, month);
  if (expected > 0) return expected;

  return null;
}

export function countIncomesByType(
  incomes: Income[],
  type: IncomeType
): number {
  return incomes.filter((income) => resolveIncomeType(income) === type).length;
}
