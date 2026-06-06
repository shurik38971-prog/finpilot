import { detectTaskCategory } from "@/lib/finance/detect-task-category";
import type { ProfileType } from "@/types/profile";
import { PROFILE_DASHBOARD_HINTS, PROFILE_TYPE_LABELS } from "@/types/profile";

export function getProfileTypeLabel(profileType: ProfileType): string {
  return PROFILE_TYPE_LABELS[profileType];
}

export function getDashboardHints(profileType: ProfileType): string[] {
  return PROFILE_DASHBOARD_HINTS[profileType];
}

export interface IndexWeights {
  cashFlow: number;
  debt: number;
  buffer: number;
  essential: number;
  diversity: number;
  stability: number;
}

export const PROFILE_INDEX_WEIGHTS: Record<ProfileType, IndexWeights> = {
  employee: {
    cashFlow: 25,
    debt: 30,
    buffer: 15,
    essential: 15,
    diversity: 10,
    stability: 5,
  },
  self_employed: {
    cashFlow: 20,
    debt: 15,
    buffer: 30,
    essential: 10,
    diversity: 5,
    stability: 20,
  },
  freelancer: {
    cashFlow: 20,
    debt: 15,
    buffer: 30,
    essential: 10,
    diversity: 5,
    stability: 20,
  },
  business_owner: {
    cashFlow: 25,
    debt: 15,
    buffer: 25,
    essential: 15,
    diversity: 5,
    stability: 15,
  },
  retiree: {
    cashFlow: 35,
    debt: 15,
    buffer: 25,
    essential: 20,
    diversity: 5,
    stability: 0,
  },
};

const INCOME_STABILITY_KEYWORDS = [
  "доход",
  "подработ",
  "фриланс",
  "клиент",
  "заказ",
  "стабил",
  "поступлен",
];

export function getProfileTaskBoost(
  profileType: ProfileType,
  task: { title: string; description: string | null },
  flags: {
    debtRelated: boolean;
    cashGapRelated: boolean;
    cushionRelated: boolean;
    expenseCutRelated: boolean;
    incomeStabilityRelated: boolean;
  }
): number {
  switch (profileType) {
    case "employee":
      if (flags.debtRelated) return 28;
      if (flags.cushionRelated) return 18;
      if (flags.expenseCutRelated) return 10;
      return 0;
    case "self_employed":
    case "freelancer":
      if (flags.cushionRelated) return 30;
      if (flags.incomeStabilityRelated) return 25;
      if (flags.debtRelated) return 15;
      return 0;
    case "business_owner":
      if (flags.cashGapRelated) return 30;
      if (flags.cushionRelated) return 22;
      if (flags.expenseCutRelated) return 18;
      return 0;
    case "retiree":
      if (flags.expenseCutRelated) return 25;
      if (flags.cushionRelated) return 22;
      if (flags.cashGapRelated) return 15;
      return 0;
    default:
      return 0;
  }
}

export function detectTaskProfileFlags(task: {
  title: string;
  description: string | null;
  goal_type?: string | null;
}) {
  const text = `${task.title} ${task.description ?? ""}`.toLowerCase();
  const category = detectTaskCategory(task.title, task.description);

  return {
    debtRelated:
      /долг|кредит|займ|ипотек|реструктур|рефинанс|погас|процент/.test(text) ||
      task.goal_type === "debt_payoff",
    cashGapRelated: /кассов|разрыв|ликвид|дефицит|не хватает|минус|просадк/.test(
      text
    ),
    cushionRelated:
      /подушк|резерв|накоп|сбереж|отлож/.test(text) ||
      task.goal_type === "safety_cushion",
    expenseCutRelated: category === "cut_optional_spending",
    incomeStabilityRelated:
      category === "increase_income" ||
      INCOME_STABILITY_KEYWORDS.some((keyword) => text.includes(keyword)),
  };
}
