import type { FinancialTask } from "@/types/tasks";

export interface RescuePlanOptionLike {
  title: string;
  type: string;
  first_step: string;
  why_fits: string;
  income_min: number;
  income_max: number;
  expected_effect?: number;
}

export interface RescuePlan {
  currentSituation: string;
  mainProblem: string;
  monthlyGap: number;
  primaryGoal: string;
  recommendedPath: string;
  nextAction: string;
  expectedResult: string;
}

export type RescueAttemptStatus =
  | "not_started"
  | "in_progress"
  | "success"
  | "failed";

export type EscapeFailureReason =
  | "no_clients"
  | "no_portfolio"
  | "no_time"
  | "other";

export const ESCAPE_FAILURE_REASONS: {
  value: EscapeFailureReason;
  label: string;
}[] = [
  { value: "no_clients", label: "Не было клиентов" },
  { value: "no_portfolio", label: "Нет портфолио" },
  { value: "no_time", label: "Не хватило времени" },
  { value: "other", label: "Другое" },
];

export function resolveAttemptStatus(plan: {
  status: string;
  attempt_status?: RescueAttemptStatus | null;
}): RescueAttemptStatus {
  if (plan.attempt_status) return plan.attempt_status;
  switch (plan.status) {
    case "active":
      return "in_progress";
    case "completed":
      return "success";
    case "abandoned":
      return "failed";
    default:
      return "not_started";
  }
}

export function isActiveEscapeAttempt(plan: {
  status: string;
  attempt_status?: RescueAttemptStatus | null;
}): boolean {
  return resolveAttemptStatus(plan) === "in_progress";
}

export function computeRescueProgress(monthlyGap: number, incomeFound: number) {
  if (monthlyGap <= 0) {
    return { percent: 0, remaining: 0 };
  }
  const percent = Math.min(100, Math.round((incomeFound / monthlyGap) * 100));
  const remaining = Math.max(0, monthlyGap - incomeFound);
  return { percent, remaining };
}

export interface RescueProgressSnapshot {
  primaryGoal: string;
  percent: number;
  incomeFound: number;
  remaining: number;
  monthlyGap: number;
}

export function buildRescueProgressSnapshot(
  rescuePlan: RescuePlan,
  incomeFound: number
): RescueProgressSnapshot {
  const { percent, remaining } = computeRescueProgress(
    rescuePlan.monthlyGap,
    incomeFound
  );
  return {
    primaryGoal: rescuePlan.primaryGoal,
    percent,
    incomeFound,
    remaining,
    monthlyGap: rescuePlan.monthlyGap,
  };
}

export interface BuildRescuePlanInput {
  monthlyIncome: number;
  netCashFlow: number;
  totalDebt: number;
  primaryGoal: string;
  escapePlan: {
    situation_summary: string;
    needed_amount: number;
    main_strategy: string;
    plan_7_days: string[];
  };
  topOption?: RescuePlanOptionLike | null;
  activePlan?: {
    option_title: string;
    option_snapshot: RescuePlanOptionLike & { first_step?: string };
  } | null;
  pendingTasks?: FinancialTask[];
}
