import { pickPrimaryGoal } from "@/lib/finance/match-task-to-goal";
import { formatCurrency } from "@/lib/utils";
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

function buildCashFlowInsight(
  forecast: CashFlowForecast[],
  netCashFlow: number
): string | null {
  const currentNet = forecast[0]?.net ?? netCashFlow;

  if (currentNet < 0) {
    const firstPositiveIndex = forecast.findIndex((point) => point.net >= 0);

    if (firstPositiveIndex > 0) {
      return `${throughMonthsLabel(firstPositiveIndex)} свободные деньги станут положительными.`;
    }

    const deficitMonths = forecast.filter((point) => point.net < 0).length;
    if (deficitMonths > 0) {
      return `При текущем сценарии дефицит сохранится ещё ${monthsLabel(deficitMonths)}.`;
    }
  }

  if (currentNet > 0) {
    return `Сейчас в месяц остаётся ${formatCurrency(currentNet)} — можно откладывать или направлять на цели.`;
  }

  return null;
}

function buildCushionInsight(
  goals: FinancialGoal[],
  netCashFlow: number
): string | null {
  if (netCashFlow <= 0) return null;

  const cushionGoal = goals.find((goal) => goal.type === "safety_cushion");
  if (!cushionGoal) return null;

  const remaining = cushionGoal.target_amount - cushionGoal.current_amount;
  if (remaining <= 0) {
    return "Подушка безопасности по вашей цели уже достигнута.";
  }

  const months = Math.ceil(remaining / netCashFlow);
  if (months <= 0 || months > 120) return null;

  return `До подушки безопасности осталось примерно ${monthsLabel(months)}.`;
}

function buildGoalInsight(
  goals: FinancialGoal[],
  netCashFlow: number
): string | null {
  if (netCashFlow <= 0) return null;

  const goal = pickPrimaryGoal(goals);
  if (!goal || goal.type === "safety_cushion") return null;

  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;

  const months = Math.ceil(remaining / netCashFlow);
  if (months <= 0 || months > 120) return null;

  return `При текущем темпе до цели «${goal.title}» останется примерно ${monthsLabel(months)}.`;
}

function buildDebtInsight(
  monthlyIncome: number,
  debtPayments: number,
  totalDebt: number
): string | null {
  if (totalDebt <= 0) return null;
  if (monthlyIncome <= 0) {
    return "Основной риск сейчас — долговая нагрузка без стабильного дохода.";
  }

  const debtShare = debtPayments / monthlyIncome;
  if (debtShare >= 0.25) {
    const percent = Math.round(debtShare * 100);
    return `На долги уходит ${percent}% дохода — это главный фактор риска.`;
  }

  return null;
}

export function interpretForecast(
  input: ForecastInterpretationInput
): string | null {
  if (input.insufficientData || input.forecast.length === 0) {
    return null;
  }

  const candidates = [
    buildCashFlowInsight(input.forecast, input.netCashFlow),
    buildCushionInsight(input.goals, input.netCashFlow),
    buildGoalInsight(input.goals, input.netCashFlow),
    buildDebtInsight(
      input.monthlyIncome,
      input.debtPayments,
      input.totalDebt
    ),
  ].filter((sentence): sentence is string => sentence != null);

  return candidates[0] ?? null;
}
