import { addMonths, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import type { CashFlowForecast, Debt, Expense, Income } from "@/types/database";
import {
  FORECAST_INSUFFICIENT_MESSAGE,
  resolveProfileForecastIncome,
  type ForecastIncomeModel,
  type ForecastScenario,
} from "@/lib/finance/forecast-profile-income";
import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";
import { DEFAULT_PROFILE_TYPE, type ProfileType } from "@/types/profile";

export interface ForecastCashFlowResult {
  data: CashFlowForecast[];
  insufficientData: boolean;
  basisLabel: string;
  scenarios?: ForecastScenario[];
  incomeModel: ForecastIncomeModel;
}

function buildForecastPoint(
  monthLabel: string,
  income: number,
  expenseTotal: number,
  debtPayments: number,
  cumulative: number,
  extras?: Pick<CashFlowForecast, "incomeMin" | "incomeMax" | "netMin" | "netMax">
): { point: CashFlowForecast; cumulative: number } {
  const net = income - expenseTotal - debtPayments;
  const nextCumulative = cumulative + net;

  return {
    point: {
      month: monthLabel,
      income,
      expenses: expenseTotal,
      debtPayments,
      net,
      cumulative: nextCumulative,
      ...extras,
    },
    cumulative: nextCumulative,
  };
}

export function forecastCashFlow(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  months = 3,
  profileType: ProfileType = DEFAULT_PROFILE_TYPE
): ForecastCashFlowResult {
  const now = new Date();
  const incomeModel = resolveProfileForecastIncome(incomes, profileType, now);

  if (incomeModel.insufficientData) {
    return {
      data: [],
      insufficientData: true,
      basisLabel: FORECAST_INSUFFICIENT_MESSAGE,
      incomeModel,
    };
  }

  const forecast: CashFlowForecast[] = [];
  let cumulative = 0;
  const baseIncome = incomeModel.baseMonthlyIncome;
  const scenarios = incomeModel.scenarios;
  const range = incomeModel.incomeRange;

  const conservativeIncome =
    scenarios?.find((item) => item.label === "Консервативный")?.monthlyIncome ??
    range?.bad;
  const optimisticIncome =
    scenarios?.find((item) => item.label === "Оптимистичный")?.monthlyIncome ??
    range?.good;

  for (let m = 0; m < months; m += 1) {
    const monthDate = startOfMonth(addMonths(now, m));
    const monthLabel = format(monthDate, "LLL yyyy", { locale: ru });
    const summary = getMonthlyFinanceSummary(
      incomes,
      expenses,
      debts,
      monthDate
    );

    const expenseTotal = summary.totalExpenses;
    const debtPayments = summary.debtPayments;

    const { point, cumulative: nextCumulative } = buildForecastPoint(
      monthLabel,
      Math.round(baseIncome),
      expenseTotal,
      debtPayments,
      cumulative,
      conservativeIncome !== undefined && optimisticIncome !== undefined
        ? {
            incomeMin: Math.round(conservativeIncome),
            incomeMax: Math.round(optimisticIncome),
            netMin: Math.round(
              conservativeIncome - expenseTotal - debtPayments
            ),
            netMax: Math.round(optimisticIncome - expenseTotal - debtPayments),
          }
        : undefined
    );

    cumulative = nextCumulative;
    forecast.push(point);
  }

  return {
    data: forecast,
    insufficientData: false,
    basisLabel: incomeModel.basisLabel,
    scenarios: incomeModel.scenarios,
    incomeModel,
  };
}
