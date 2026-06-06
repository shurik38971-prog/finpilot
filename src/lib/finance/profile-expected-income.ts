import {
  averageActualInMonthsWithData,
  expectedIncomeAmount,
  resolveIncomeType,
} from "@/lib/finance/income-model";
import {
  filterAdditionalIncomes,
  filterOperationalIncomes,
} from "@/lib/finance/operational-incomes";
import {
  actualIncomeLastThreeMonthsStats,
  getExpectedMonthlyIncome,
} from "@/lib/finance/variable-income-scenarios";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import { PROFILE_TYPES, type ProfileType } from "@/types/profile";
import type { Income } from "@/types/database";

/** Recurring expected from supplementary income rows only. */
export function recurringExpectedMonthlyTotal(incomes: Income[]): number {
  return filterAdditionalIncomes(incomes)
    .filter(
      (income) =>
        resolveIncomeType(income) === "expected" &&
        income.is_recurring &&
        income.frequency
    )
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);
}

function resolveBusinessOwnerExpectedIncome(
  incomes: Income[],
  storedExpectedMonthly: number | null,
  from: Date
): number | null {
  const operational = filterOperationalIncomes(incomes);
  const businessIncome = operational.find((income) =>
    income.title.toLowerCase().includes("бизнес")
  );

  if (businessIncome) {
    const amount =
      resolveIncomeType(businessIncome) === "expected"
        ? expectedIncomeAmount(businessIncome)
        : businessIncome.amount;
    if (amount > 0) return Math.round(amount);
  }

  const recurring = recurringExpectedMonthlyTotal(operational);
  if (recurring > 0) return Math.round(recurring);

  const history = actualIncomeLastThreeMonthsStats(operational, from);
  if (history) return history.base;

  const actualStats = averageActualInMonthsWithData(operational, 6, from);
  if (actualStats && actualStats.monthsWithData >= 2) {
    return Math.round(actualStats.average);
  }

  if (storedExpectedMonthly && storedExpectedMonthly > 0) {
    return Math.round(storedExpectedMonthly);
  }

  return null;
}

/**
 * Profile-aware expected monthly income for dashboard, forecast, health index and AI.
 * Uses incomes first, then stored profile value (salary/pension/business from onboarding).
 */
export function resolveProfileExpectedIncome(
  profileType: ProfileType,
  incomes: Income[],
  profileIncome: ProfileIncomeParameters | null = null,
  from: Date = new Date()
): number | null {
  const operational = filterOperationalIncomes(incomes);
  const stored = profileIncome?.storedExpectedMonthly ?? null;

  switch (profileType) {
    case PROFILE_TYPES.employee:
    case PROFILE_TYPES.retiree: {
      if (stored && stored > 0) return Math.round(stored);
      return null;
    }

    case PROFILE_TYPES.self_employed:
    case PROFILE_TYPES.freelancer:
      return getExpectedMonthlyIncome(profileIncome, operational, from);

    case PROFILE_TYPES.business_owner:
      return resolveBusinessOwnerExpectedIncome(operational, stored, from);

    default: {
      const recurring = recurringExpectedMonthlyTotal(operational);
      if (recurring > 0) return Math.round(recurring);
      if (stored && stored > 0) return Math.round(stored);
      return null;
    }
  }
}

