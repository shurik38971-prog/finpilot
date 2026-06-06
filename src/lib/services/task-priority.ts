import {
  detectTaskProfileFlags,
  getProfileTaskBoost,
} from "@/lib/profile/financial-profile";
import type { GoalType } from "@/types/goals";
import type { TaskImpact } from "@/types/task-impact";
import { DEFAULT_PROFILE_TYPE, type ProfileType } from "@/types/profile";

const DEBT_KEYWORDS = [
  "долг",
  "кредит",
  "займ",
  "ипотек",
  "реструктур",
  "рефинанс",
  "погас",
  "процент",
];
const CASH_GAP_KEYWORDS = [
  "кассов",
  "разрыв",
  "ликвид",
  "дефицит",
  "не хватает",
  "минус",
  "просроч",
  "просадк",
];
const CUSHION_KEYWORDS = ["подушк", "резерв", "накоп", "сбереж", "отлож"];

export interface TaskPriorityInput {
  title: string;
  description: string | null;
  impact_score: number;
  impact_label: string | null;
  due_date: string | null;
  goal_id: string | null;
  goal_type?: GoalType | null;
}

export interface TaskPriorityResult {
  priority_score: number;
  financial_impact: number;
  reasons: string[];
}

function taskText(task: TaskPriorityInput): string {
  return `${task.title} ${task.description ?? ""}`.toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function effectTier(task: TaskPriorityInput): "high" | "medium" | "low" {
  const label = task.impact_label?.toLowerCase() ?? "";
  if (task.impact_score >= 70 || label.includes("высок")) return "high";
  if (task.impact_score >= 45 || label.includes("средн")) return "medium";
  return "low";
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

function isUrgent(dueDate: string | null): boolean {
  if (!dueDate || isOverdue(dueDate)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7;
}

export function calculateTaskPriority(
  task: TaskPriorityInput,
  options?: {
    hasNegativeCashflow?: boolean;
    impact?: TaskImpact | null;
    profileType?: ProfileType;
  }
): TaskPriorityResult {
  const text = taskText(task);
  const reasons: string[] = [];
  let score = 0;

  const tier = effectTier(task);
  if (tier === "high") {
    score += 40;
    reasons.push("сильно повлияет на ваши деньги");
  } else if (tier === "medium") {
    score += 20;
    reasons.push("заметно повлияет на ваши деньги");
  } else {
    score += 10;
  }

  const profileType = options?.profileType ?? DEFAULT_PROFILE_TYPE;
  const profileFlags = detectTaskProfileFlags({
    title: task.title,
    description: task.description,
    goal_type: task.goal_type,
  });

  const debtRelated = profileFlags.debtRelated;
  if (debtRelated) {
    score += 30;
    reasons.push("помогает меньше платить по долгам");
  }

  const cashGapRelated =
    profileFlags.cashGapRelated || options?.hasNegativeCashflow;
  if (cashGapRelated) {
    score += 30;
    reasons.push("срочно, если денег не хватает до следующего дохода");
  }

  const cushionRelated = profileFlags.cushionRelated;
  if (cushionRelated) {
    score += 20;
    reasons.push("ускоряет формирование подушки безопасности");
  }

  const profileBoost = getProfileTaskBoost(profileType, task, {
    ...profileFlags,
    cashGapRelated: Boolean(cashGapRelated),
  });
  if (profileBoost > 0) {
    score += profileBoost;
    reasons.push("важно для вашего финансового профиля");
  }

  if (task.goal_id && !debtRelated && !cushionRelated) {
    reasons.push("быстрее приблизит к вашей цели");
    score += 10;
  }

  if (isOverdue(task.due_date)) {
    score += 20;
    reasons.push("срок задачи уже прошёл");
  } else if (isUrgent(task.due_date)) {
    score += 15;
    reasons.push("срочно — меньше 7 дней до дедлайна");
  }

  if (
    options?.impact &&
    Number(options.impact.projected_cashflow) >
      Number(options.impact.current_cashflow)
  ) {
    if (!reasons.some((r) => r.includes("останется") || r.includes("денег"))) {
      reasons.push("после этого останется больше денег в месяц");
    }
  }

  const cashflowDelta = options?.impact
    ? Math.round(
        Number(options.impact.projected_cashflow) -
          Number(options.impact.current_cashflow)
      )
    : 0;

  const financial_impact = Math.max(
    0,
    cashflowDelta > 0 ? cashflowDelta : Math.round(task.impact_score * 100)
  );

  const uniqueReasons = [...new Set(reasons)];

  return {
    priority_score: Math.min(100, score),
    financial_impact,
    reasons:
      uniqueReasons.length > 0
        ? uniqueReasons
        : ["самое полезное действие из доступных сейчас"],
  };
}

export function buildTaskMotivation(impact: TaskImpact | null) {
  if (!impact) {
    return {
      indexFrom: null as number | null,
      indexTo: null as number | null,
      goalMonthsFaster: null as number | null,
      monthlySavings: null as number | null,
    };
  }

  const indexFrom = impact.current_index;
  const indexTo = impact.projected_index;
  const goalMonthsFaster =
    impact.current_goal_months !== null &&
    impact.projected_goal_months !== null
      ? impact.current_goal_months - impact.projected_goal_months
      : null;
  const monthlySavings = Math.max(
    0,
    Math.round(
      Number(impact.projected_cashflow) - Number(impact.current_cashflow)
    )
  );

  return { indexFrom, indexTo, goalMonthsFaster, monthlySavings };
}
