import type { Debt, Expense, Income, ScenarioResult } from "@/types/database";
import { calculateFinancialIndex, monthlyExpenseTotal, monthlyIncomeTotal } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";
import { calculateDebtPayoff } from "@/lib/finance/debt-strategies";

export interface ScenarioInput {
  name: string;
  incomeChangePercent: number;
  expenseChangePercent: number;
  extraDebtPayment: number;
  removeNonEssential: boolean;
}

function scaleIncomes(incomes: Income[], percent: number): Income[] {
  const factor = 1 + percent / 100;
  return incomes.map((i) => ({ ...i, amount: i.amount * factor }));
}

function scaleExpenses(
  expenses: Expense[],
  percent: number,
  removeNonEssential: boolean
): Expense[] {
  let result = expenses;
  if (removeNonEssential) {
    result = expenses.filter((e) => e.is_essential);
  }
  const factor = 1 + percent / 100;
  return result.map((e) => ({ ...e, amount: e.amount * factor }));
}

export function runScenario(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  input: ScenarioInput
): ScenarioResult {
  const adjIncomes = scaleIncomes(incomes, input.incomeChangePercent);
  const adjExpenses = scaleExpenses(
    expenses,
    input.expenseChangePercent,
    input.removeNonEssential
  );

  const monthlyIncome = monthlyIncomeTotal(adjIncomes);
  const monthlyExpenses = monthlyExpenseTotal(adjExpenses);

  const plan = calculateDebtPayoff(debts, input.extraDebtPayment, "avalanche");
  const forecast = forecastCashFlow(adjIncomes, adjExpenses, debts, 3);
  const threeMonthBalance = forecast[forecast.length - 1]?.cumulative ?? 0;

  return {
    name: input.name,
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    extraDebtPayment: input.extraDebtPayment,
    monthsToDebtFree: plan.monthsToFreedom,
    financialIndex: calculateFinancialIndex(adjIncomes, adjExpenses, debts),
    threeMonthBalance: Math.round(threeMonthBalance),
  };
}

export const PRESET_SCENARIOS: ScenarioInput[] = [
  {
    name: "Потеря 30% дохода",
    incomeChangePercent: -30,
    expenseChangePercent: 0,
    extraDebtPayment: 0,
    removeNonEssential: false,
  },
  {
    name: "Сократить расходы на 20%",
    incomeChangePercent: 0,
    expenseChangePercent: -20,
    extraDebtPayment: 0,
    removeNonEssential: false,
  },
  {
    name: "Антикризис: убрать необязательное",
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    extraDebtPayment: 0,
    removeNonEssential: true,
  },
  {
    name: "+10 000 ₽ на долги",
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    extraDebtPayment: 10000,
    removeNonEssential: false,
  },
  {
    name: "Рост дохода +20%",
    incomeChangePercent: 20,
    expenseChangePercent: 0,
    extraDebtPayment: 5000,
    removeNonEssential: false,
  },
];
