import {
  averageActualInMonthsWithData,
  expectedIncomeAmount,
  resolveIncomeType,
} from "@/lib/finance/income-model";
import { formatCurrency } from "@/lib/utils";
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

function findByTitleIncludes(
  incomes: Income[],
  ...needles: string[]
): Income | undefined {
  return incomes.find((income) =>
    needles.some((needle) =>
      income.title.toLowerCase().includes(needle.toLowerCase())
    )
  );
}

function recurringExpectedMonthlyTotal(incomes: Income[]): number {
  return incomes
    .filter((income) => resolveIncomeType(income) === "expected")
    .reduce((sum, income) => sum + expectedIncomeAmount(income), 0);
}

function monthlyAmountForIncome(income: Income): number {
  if (resolveIncomeType(income) === "expected") {
    return expectedIncomeAmount(income);
  }
  return income.amount;
}

export function resolveProfileForecastIncome(
  incomes: Income[],
  profileType: ProfileType,
  from: Date = new Date()
): ForecastIncomeModel {
  const recurring = recurringExpectedMonthlyTotal(incomes);

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
      const averageIncome = findByTitleIncludes(incomes, "средн");
      const badIncome = findByTitleIncludes(incomes, "плох");
      const goodIncome = findByTitleIncludes(incomes, "хорош");

      const average = averageIncome
        ? monthlyAmountForIncome(averageIncome)
        : recurring;

      if (average <= 0) {
        return {
          insufficientData: true,
          basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
          baseMonthlyIncome: 0,
        };
      }

      const range: ForecastIncomeRange = {
        average,
        bad: badIncome?.amount ?? Math.round(average * 0.7),
        good: goodIncome?.amount ?? Math.round(average * 1.3),
      };

      return {
        insufficientData: false,
        basisLabel: `На основании среднего дохода ${formatCurrency(average)}/мес · диапазон ${formatCurrency(range.bad)} – ${formatCurrency(range.good)}`,
        baseMonthlyIncome: average,
        incomeRange: range,
      };
    }

    case PROFILE_TYPES.freelancer: {
      const averageIncome = findByTitleIncludes(incomes, "средн");
      const badIncome = findByTitleIncludes(incomes, "плох");
      const goodIncome = findByTitleIncludes(incomes, "хорош");

      const base = averageIncome ? monthlyAmountForIncome(averageIncome) : recurring;
      const conservative = badIncome?.amount ?? Math.round(base * 0.75);
      const optimistic = goodIncome?.amount ?? Math.round(base * 1.25);

      if (base <= 0) {
        return {
          insufficientData: true,
          basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
          baseMonthlyIncome: 0,
        };
      }

      return {
        insufficientData: false,
        basisLabel:
          "Три сценария дохода: консервативный, базовый и оптимистичный",
        baseMonthlyIncome: base,
        scenarios: [
          { label: "Консервативный", monthlyIncome: conservative },
          { label: "Базовый", monthlyIncome: base },
          { label: "Оптимистичный", monthlyIncome: optimistic },
        ],
      };
    }

    case PROFILE_TYPES.business_owner: {
      const businessIncome = findByTitleIncludes(
        incomes,
        "бизнес",
        "средн"
      );
      const expectedMonthly = businessIncome
        ? monthlyAmountForIncome(businessIncome)
        : recurring;
      const actualStats = averageActualInMonthsWithData(incomes, 6, from);

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

      return {
        insufficientData: true,
        basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
        baseMonthlyIncome: 0,
      };
    }
  }
}
