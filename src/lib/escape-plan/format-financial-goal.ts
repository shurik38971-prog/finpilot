import { formatCurrency } from "@/lib/utils";
import { resolvePrimaryGoal, type UserCapabilities } from "@/types/escape-plan";
import type { FinancialGoal } from "@/types/goals";

export function formatMainFinancialGoal(
  goals: FinancialGoal[],
  capabilities: UserCapabilities | null,
  totalDebt = 0
): string {
  const goal = goals[0];
  if (goal) {
    if (goal.type === "debt_payoff" && goal.target_amount > 0) {
      return `Закрыть долг ${formatCurrency(goal.target_amount)}`;
    }
    if (goal.target_amount > 0) {
      return `${goal.title} — ${formatCurrency(goal.target_amount)}`;
    }
    return goal.title;
  }

  const primary = resolvePrimaryGoal(capabilities);
  if (primary === "Закрыть долги" && totalDebt > 0) {
    return `Закрыть долг ${formatCurrency(totalDebt)}`;
  }
  return primary;
}
