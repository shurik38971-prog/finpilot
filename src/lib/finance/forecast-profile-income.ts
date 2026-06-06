import {
  averageActualInMonthsWithData,
  expectedIncomeAmount,
  resolveIncomeType,
} from "@/lib/finance/income-model";
import { filterOperationalIncomes } from "@/lib/finance/operational-incomes";
import { formatCurrency } from "@/lib/utils";
import {
  hasProfileIncomeParameters,
  type ProfileIncomeParameters,
} from "@/types/profile-income";
import { PROFILE_TYPES, type ProfileType } from "@/types/profile";
import type { Income } from "@/types/database";

export const FORECAST_INSUFFICIENT_MESSAGE =
  "Недостаточно данных для прогноза. Укажите ожидаемый ежемесячный доход.";

export interface ForecastScenario {
  label: string;
  monthlyIncome: number;
}

export interface ForecastIncomeRange {
  bad: number;
  average: number;
  good: number;
}

export interface ForecastIncomeModel {
  insufficientData: boolean;
  basisLabel: string;
  baseMonthlyIncome: number;
  scenarios?: ForecastScenario[];
  incomeRange?: ForecastIncomeRange;
}

function recurringExpectedMonthlyTotal(incomes: Income[]): number {
  return incomes
    .filter((income) => resolveIncomeType(income) === "expected")
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);
}

function variableIncomeFromProfile(
  profileIncome: ProfileIncomeParameters
): ForecastIncomeModel | null {
  const average = profileIncome.averageMonthly ?? 0;
  if (average <= 0) return null;

  const range: ForecastIncomeRange = {
    average,
    bad: profileIncome.badMonth ?? Math.round(average * 0.7),
    good: profileIncome.goodMonth ?? Math.round(average * 1.3),
  };

  return {
    insufficientData: false,
    basisLabel: `На основании параметров профиля: средний ${formatCurrency(average)}/мес · диапазон ${formatCurrency(range.bad)} – ${formatCurrency(range.good)}`,
    baseMonthlyIncome: average,
    incomeRange: range,
  };
}

function freelancerIncomeFromProfile(
  profileIncome: ProfileIncomeParameters
): ForecastIncomeModel | null {
  const base = profileIncome.averageMonthly ?? 0;
  if (base <= 0) return null;

  const conservative =
    profileIncome.badMonth ?? Math.round(base * 0.75);
  const optimistic =
    profileIncome.goodMonth ?? Math.round(base * 1.25);

  return {
    insufficientData: false,
    basisLabel:
      "На основании параметров профиля: консервативный, базовый и оптимистичный сценарии",
    baseMonthlyIncome: base,
    scenarios: [
      { label: "Консервативный", monthlyIncome: conservative },
      { label: "Базовый", monthlyIncome: base },
      { label: "Оптимистичный", monthlyIncome: optimistic },
    ],
  };
}

export function resolveProfileForecastIncome(
  incomes: Income[],
  profileType: ProfileType,
  profileIncome: ProfileIncomeParameters | null = null,
  from: Date = new Date()
): ForecastIncomeModel {
  const operationalIncomes = filterOperationalIncomes(incomes);
  const recurring = recurringExpectedMonthlyTotal(operationalIncomes);

  switch (profileType) {
    case PROFILE_TYPES.employee: {
      if (recurring <= 0) {
        return {
          insufficientData: true,
          basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
          baseMonthlyIncome: 0,
        };
      }

      return {
        insufficientData: false,
        basisLabel: `На основании регулярной зарплаты: ${formatCurrency(recurring)}/мес`,
        baseMonthlyIncome: recurring,
      };
    }

    case PROFILE_TYPES.retiree: {
      if (recurring <= 0) {
        return {
          insufficientData: true,
          basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
          baseMonthlyIncome: 0,
        };
      }

      return {
        insufficientData: false,
        basisLabel: `На основании пенсии: ${formatCurrency(recurring)}/мес`,
        baseMonthlyIncome: recurring,
      };
    }

    case PROFILE_TYPES.self_employed: {
      const fromProfile = profileIncome
        ? variableIncomeFromProfile(profileIncome)
        : null;
      if (fromProfile) return fromProfile;

      return {
        insufficientData: true,
        basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
        baseMonthlyIncome: 0,
      };
    }

    case PROFILE_TYPES.freelancer: {
      const fromProfile = profileIncome
        ? freelancerIncomeFromProfile(profileIncome)
        : null;
      if (fromProfile) return fromProfile;

      return {
        insufficientData: true,
        basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
        baseMonthlyIncome: 0,
      };
    }

    case PROFILE_TYPES.business_owner: {
      const businessIncome = operationalIncomes.find((income) =>
        income.title.toLowerCase().includes("бизнес")
      );
      const expectedMonthly = businessIncome
        ? resolveIncomeType(businessIncome) === "expected"
          ? expectedIncomeAmount(businessIncome)
          : businessIncome.amount
        : recurring;
      const actualStats = averageActualInMonthsWithData(
        operationalIncomes,
        6,
        from
      );

      if (actualStats && actualStats.monthsWithData >= 2) {
        const monthly = Math.round(actualStats.average);
        const seasonNote =
          actualStats.monthsWithData >= 3
            ? ` · учтена динамика за ${actualStats.monthsWithData} мес.`
            : "";

        return {
          insufficientData: false,
          basisLabel: `На основании фактического дохода бизнеса: ${formatCurrency(monthly)}/мес${seasonNote}`,
          baseMonthlyIncome: monthly,
        };
      }

      if (expectedMonthly > 0) {
        return {
          insufficientData: false,
          basisLabel: `На основании ожидаемого среднего дохода бизнеса: ${formatCurrency(expectedMonthly)}/мес`,
          baseMonthlyIncome: expectedMonthly,
        };
      }

      return {
        insufficientData: true,
        basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
        baseMonthlyIncome: 0,
      };
    }

    default: {
      if (recurring > 0) {
        return {
          insufficientData: false,
          basisLabel: `На основании ожидаемого дохода: ${formatCurrency(recurring)}/мес`,
          baseMonthlyIncome: recurring,
        };
      }

      if (hasProfileIncomeParameters(profileIncome)) {
        const fromProfile = variableIncomeFromProfile(profileIncome!);
        if (fromProfile) return fromProfile;
      }

      return {
        insufficientData: true,
        basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
        baseMonthlyIncome: 0,
      };
    }
  }
}
