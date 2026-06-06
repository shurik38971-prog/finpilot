import { isDateInMonth } from "@/lib/finance/date-utils";
import { actualIncomeInMonth } from "@/lib/finance/income-model";
import {
  filterAdditionalIncomes,
  filterOperationalIncomes,
} from "@/lib/finance/operational-incomes";
import { resolveProfileExpectedIncome } from "@/lib/finance/profile-expected-income";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";
import type { Income } from "@/types/database";
import { toMonthlyAmount } from "@/lib/utils";

export interface MonthlyIncomeBreakdown {
  primaryIncome: number;
  additionalIncome: number;
  monthlyIncome: number;
  actualAdditionalIncome: number;
}

export function additionalIncomeInMonth(
  incomes: Income[],
  month: Date = new Date()
): number {
  const additional = filterAdditionalIncomes(incomes);

  const recurring = additional
    .filter((income) => income.is_recurring && income.frequency)
    .reduce(
      (sum, income) =>
        sum + toMonthlyAmount(income.amount, income.frequency!, true),
      0
    );

  const oneTime = additional
    .filter((income) => !income.is_recurring && isDateInMonth(income.date, month))
    .reduce((sum, income) => sum + income.amount, 0);

  return Math.round(recurring + oneTime);
}

export function actualAdditionalIncomeInMonth(
  incomes: Income[],
  month: Date = new Date()
): number {
  return Math.round(
    actualIncomeInMonth(filterAdditionalIncomes(incomes), month)
  );
}

/**
 * Default: primary income from profile + additional incomes.
 * Advanced (useActualIncomeOnly): only money already received this month.
 */
export function resolveMonthlyIncome(
  profileType: ProfileType,
  incomes: Income[],
  profileIncome: ProfileIncomeParameters | null,
  month: Date = new Date()
): MonthlyIncomeBreakdown {
  const operational = filterOperationalIncomes(incomes);
  const primaryIncome =
    resolveProfileExpectedIncome(profileType, operational, profileIncome, month) ??
    0;
  const additionalIncome = additionalIncomeInMonth(operational, month);
  const actualAdditionalIncome = actualAdditionalIncomeInMonth(
    operational,
    month
  );

  if (profileIncome?.useActualIncomeOnly) {
    const actualAll = actualIncomeInMonth(operational, month);
    return {
      primaryIncome: 0,
      additionalIncome: actualAll,
      monthlyIncome: actualAll,
      actualAdditionalIncome: actualAll,
    };
  }

  return {
    primaryIncome,
    additionalIncome,
    monthlyIncome: primaryIncome + additionalIncome,
    actualAdditionalIncome,
  };
}

/** @deprecated use resolveMonthlyIncome */
export function resolvePlanningMonthlyIncome(
  actualCurrentMonth: number,
  profileType: ProfileType,
  incomes: Income[],
  profileIncome: ProfileIncomeParameters | null = null,
  from?: Date
): number {
  return resolveMonthlyIncome(
    profileType,
    incomes,
    profileIncome,
    from ?? new Date()
  ).monthlyIncome;
}
