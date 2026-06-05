export type GoalType = "safety_cushion" | "debt_payoff" | "custom";

export interface FinancialGoal {
  id: string;
  user_id: string;
  type: GoalType;
  title: string;
  target_amount: number;
  current_amount: number;
  debt_id: string | null;
  deadline: string | null;
  created_at: string;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  safety_cushion: "Подушка безопасности",
  debt_payoff: "Закрыть долг",
  custom: "Своя цель",
};
