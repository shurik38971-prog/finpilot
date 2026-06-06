import { isDateInMonth } from "@/lib/finance/date-utils";
import {
  actualIncomeInMonth,
  resolveIncomeType,
} from "@/lib/finance/income-model";
import {
  filterAdditionalIncomes,
  filterOperationalIncomes,
  isPrimaryIncome,
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
  actualPrimaryIncome: number;
  usesOnboardingBaseline: boolean;
}

function actualPrimaryIncomeInMonth(
  incomes: Income[],
  month: Date = new Date()
): number {
  return filterOperationalIncomes(incomes)
    .filter(
      (income) =>
        isPrimaryIncome(income) &&
        resolveIncomeType(income) === "actual" &&
        isDateInMonth(income.date, month)
    )
    .reduce((sum, income) => sum + income.amount, 0);
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
  const profilePrimary =
    resolveProfileExpectedIncome(
      profileType,
      operational,
      profileIncome,
      month
    ) ?? 0;
  const additionalIncome = additionalIncomeInMonth(operational, month);
  const actualAdditionalIncome = actualAdditionalIncomeInMonth(
    operational,
    month
  );
  const loggedPrimaryActual = actualPrimaryIncomeInMonth(operational, month);

  if (profileIncome?.useActualIncomeOnly) {
    const actualAll = actualIncomeInMonth(operational, month);
    return {
      primaryIncome: 0,
      additionalIncome: actualAll,
      monthlyIncome: actualAll,
      actualAdditionalIncome: actualAll,
      actualPrimaryIncome: loggedPrimaryActual,
      usesOnboardingBaseline: false,
    };
  }

  const hasLoggedPrimary = loggedPrimaryActual > 0;
  const primaryIncome = hasLoggedPrimary ? loggedPrimaryActual : profilePrimary;
  const usesOnboardingBaseline = !hasLoggedPrimary && profilePrimary > 0;

  return {
    primaryIncome,
    additionalIncome,
    monthlyIncome: primaryIncome + additionalIncome,
    actualAdditionalIncome,
    actualPrimaryIncome: loggedPrimaryActual,
    usesOnboardingBaseline,
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
