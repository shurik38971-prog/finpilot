import { addMonths, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import type { CashFlowForecast, Debt, Expense, Income } from "@/types/database";
import { resolveForecastMonthlyIncome } from "@/lib/finance/income-model";
import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";

export interface ForecastCashFlowResult {
  data: CashFlowForecast[];
  insufficientData: boolean;
}

export function forecastCashFlow(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  months = 3
): ForecastCashFlowResult {
  const now = new Date();
  const baseIncome = resolveForecastMonthlyIncome(incomes, now);

  if (baseIncome === null) {
    return { data: [], insufficientData: true };
  }

  const forecast: CashFlowForecast[] = [];
  let cumulative = 0;

  for (let m = 0; m < months; m++) {
    const monthDate = startOfMonth(addMonths(now, m));
    const monthLabel = format(monthDate, "LLL yyyy", { locale: ru });
    const summary = getMonthlyFinanceSummary(
      incomes,
      expenses,
      debts,
      monthDate
    );

    const uncertaintyFactor = 1 - m * 0.03;
    const income = Math.round(baseIncome * uncertaintyFactor);
    const expenseTotal = summary.totalExpenses;
    const debtPayments = summary.debtPayments;
    const net = income - expenseTotal - debtPayments;
    cumulative += net;

    forecast.push({
      month: monthLabel,
      income,
      expenses: expenseTotal,
      debtPayments,
      net,
      cumulative,
    });
  }

  return { data: forecast, insufficientData: false };
}
