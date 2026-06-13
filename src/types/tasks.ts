import type { FinancialGoal } from "@/types/goals";
import type { TaskImpact } from "@/types/task-impact";

export type TaskStatus = "pending" | "done" | "postponed" | "archived";

export type TaskCategory =
  | "debt_negotiation"
  | "cut_optional_spending"
  | "increase_income"
  | "budget_control"
  | "emergency_fund"
  | "other";

export interface FinancialTask {
  id: string;
  user_id: string;
  analysis_id: string | null;
  goal_id: string | null;
  goal_progress_amount: number | null;
  title: string;
  normalized_title?: string | null;
  task_category?: TaskCategory | string | null;
  description: string | null;
  explanation?: string | null;
  impact_score: number;
  impact_label: string | null;
  priority_score: number;
  financial_impact: number;
  status: TaskStatus;
  due_date: string | null;
  escape_plan_id?: string | null;
  order_index?: number | null;
  created_at: string;
  completed_at: string | null;
}

export type FinancialTaskGoal = Pick<
  FinancialGoal,
  "id" | "title" | "type" | "target_amount" | "current_amount"
>;

export interface FinancialTaskWithGoal extends FinancialTask {
  goal: FinancialTaskGoal | null;
  impact: TaskImpact | null;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Активна",
  done: "Выполнена",
  postponed: "Отложена",
  archived: "В архиве",
};

export interface PrimaryGoalFocus {
  goal: FinancialTaskGoal;
  task: FinancialTaskWithGoal | null;
  remaining: number;
  progressPercent: number;
  taskImpact: TaskImpact | null;
}

export interface NextBestActionMotivation {
  indexFrom: number | null;
  indexTo: number | null;
  goalMonthsFaster: number | null;
  monthlySavings: number | null;
}

export interface NextBestActionResult {
  id: string;
  title: string;
  description: string | null;
  explanation: string | null;
  task_category?: TaskCategory | string | null;
  impact_score: number;
  priority_score: number;
  financial_impact: number;
  due_date: string | null;
  goal: FinancialTaskGoal | null;
  impact: TaskImpact | null;
  reasons: string[];
  motivation: NextBestActionMotivation;
}
