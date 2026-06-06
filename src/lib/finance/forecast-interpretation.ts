import { pickPrimaryGoal } from "@/lib/finance/match-task-to-goal";
import type { CashFlowForecast } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";

export interface ForecastInterpretationInput {
  forecast: CashFlowForecast[];
  insufficientData: boolean;
  netCashFlow: number;
  monthlyIncome: number;
  totalDebt: number;
  debtPayments: number;
  goals: FinancialGoal[];
}

function monthsLabel(count: number): string {
  const n = Math.abs(Math.round(count));
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return `${n} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} месяца`;
  }
  return `${n} месяцев`;
}

function throughMonthsLabel(count: number): string {
  if (count === 1) return "Через 1 месяц";
  return `Через ${monthsLabel(count)}`;
}

function isDebtLoadRisk(
  monthlyIncome: number,
  debtPayments: number,
  totalDebt: number
): boolean {
  if (totalDebt <= 0) return false;
  if (monthlyIncome <= 0) return true;
  return debtPayments / monthlyIncome >= 0.25 || debtPayments + totalDebt * 0.02 > monthlyIncome * 0.4;
}

function buildCashFlowSentence(
  forecast: CashFlowForecast[],
  netCashFlow: number
): string | null {
  const currentNet = forecast[0]?.net ?? netCashFlow;

  if (currentNet < 0) {
    const firstPositiveIndex = forecast.findIndex((point) => point.net >= 0);

    if (firstPositiveIndex > 0) {
      return `${throughMonthsLabel(firstPositiveIndex)} денежный поток станет положительным.`;
    }

    const deficitMonths = forecast.filter((point) => point.net < 0).length;
    if (deficitMonths > 0) {
      return `При текущей ситуации дефицит сохранится ещё ${monthsLabel(deficitMonths)}.`;
    }
  }

  return null;
}

function buildGoalSentence(
  goals: FinancialGoal[],
  netCashFlow: number
): string | null {
  if (netCashFlow <= 0) return null;

  const goal = pickPrimaryGoal(goals);
  if (!goal) return null;

  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;

  const months = Math.ceil(remaining / netCashFlow);
  if (months <= 0 || months > 120) return null;

  return `При текущем темпе до цели останется примерно ${monthsLabel(months)}.`;
}

export function interpretForecast(
  input: ForecastInterpretationInput
): string | null {
  if (input.insufficientData || input.forecast.length === 0) {
    return null;
  }

  const sentences: string[] = [];

  const cashFlowSentence = buildCashFlowSentence(
    input.forecast,
    input.netCashFlow
  );
  if (cashFlowSentence) {
    sentences.push(cashFlowSentence);
  }

  const goalSentence = buildGoalSentence(input.goals, input.netCashFlow);
  if (goalSentence && sentences.length < 2) {
    sentences.push(goalSentence);
  }

  if (
    sentences.length < 2 &&
    isDebtLoadRisk(
      input.monthlyIncome,
      input.debtPayments,
      input.totalDebt
    )
  ) {
    sentences.push("Основной риск сейчас — долговая нагрузка.");
  }

  if (sentences.length === 0) {
    return null;
  }

  return sentences.slice(0, 2).join(" ");
}
