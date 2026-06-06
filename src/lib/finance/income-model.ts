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
  const recurringExpected = incomes
    .filter(
      (income) =>
        resolveIncomeType(income) === "expected" &&
        income.is_recurring &&
        income.frequency
    )
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);

  const oneTimeExpected = incomes
    .filter(
      (income) =>
        resolveIncomeType(income) === "expected" &&
        !income.is_recurring &&
        isDateInMonth(income.date, month)
    )
    .reduce((sum, income) => sum + income.amount, 0);

  return recurringExpected + oneTimeExpected;
}

export interface ActualIncomeAverage {
  average: number;
  monthsWithData: number;
}

export function averageActualInMonthsWithData(
  incomes: Income[],
  months = 3,
  from: Date = new Date()
): ActualIncomeAverage | null {
  let total = 0;
  let monthsWithData = 0;

  for (let m = 0; m < months; m += 1) {
    const monthIncome = actualIncomeInMonth(
      incomes,
      startOfMonth(subMonths(from, m))
    );
    if (monthIncome > 0) {
      total += monthIncome;
      monthsWithData += 1;
    }
  }

  if (monthsWithData === 0) return null;

  return {
    average: total / monthsWithData,
    monthsWithData,
  };
}

export function averageActualIncomeLastMonths(
  incomes: Income[],
  months = 3,
  from: Date = new Date()
): number | null {
  return averageActualInMonthsWithData(incomes, months, from)?.average ?? null;
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
  const recurringExpected = incomes
    .filter(
      (income) =>
        resolveIncomeType(income) === "expected" &&
        income.is_recurring &&
        income.frequency
    )
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);

  if (recurringExpected > 0) {
    return recurringExpected;
  }

  const averageActual = averageActualInMonthsWithData(incomes, 3, month);
  if (averageActual && averageActual.monthsWithData >= 2) {
    return averageActual.average;
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
