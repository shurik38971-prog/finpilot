import { getMonthlyPaymentForAnalysis } from "@/lib/finance/debt-payment";
import type { Debt, DebtKind } from "@/types/database";

export type DebtPriorityLevel = "high" | "medium" | "low";

export interface DebtPriorityInput {
  debt_kind: DebtKind;
  interest_rate: number;
  remaining_amount: number;
  monthly_payment: number;
  is_overdue: boolean;
  due_day: number | null;
  monthly_income?: number | null;
}

export interface DebtPriorityAssessment {
  level: DebtPriorityLevel;
  /** Internal sort score: higher = more urgent. */
  score: number;
  label: string;
  explanation: string;
}

const LEVEL_LABELS: Record<DebtPriorityLevel, string> = {
  high: "Высокий приоритет",
  medium: "Средний приоритет",
  low: "Низкий приоритет",
};

const KIND_WEIGHT: Record<DebtKind, number> = {
  microloan: 22,
  credit_card: 18,
  credit: 10,
  installment: 6,
  other: 8,
  personal_loan: 2,
};

function daysUntilDueDay(dueDay: number): number | null {
  const today = new Date();
  const currentDay = today.getDate();
  if (dueDay === currentDay) return 0;
  if (dueDay > currentDay) return dueDay - currentDay;
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  return daysInMonth - currentDay + dueDay;
}

function scoreToLevel(score: number): DebtPriorityLevel {
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function paymentBurdenScore(
  monthlyPayment: number,
  monthlyIncome?: number | null
): { points: number; reason: string | null } {
  if (monthlyIncome && monthlyIncome > 0) {
    const share = monthlyPayment / monthlyIncome;
    if (share >= 0.25) {
      return {
        points: 22,
        reason: "платёж занимает большую долю дохода",
      };
    }
    if (share >= 0.12) {
      return {
        points: 12,
        reason: "заметная нагрузка на бюджет",
      };
    }
    if (share >= 0.06) {
      return { points: 6, reason: null };
    }
    return { points: 0, reason: null };
  }

  if (monthlyPayment >= 40_000) {
    return { points: 16, reason: "крупный ежемесячный платёж" };
  }
  if (monthlyPayment >= 20_000) {
    return { points: 10, reason: "ощутимый ежемесячный платёж" };
  }
  if (monthlyPayment >= 8_000) {
    return { points: 5, reason: null };
  }
  return { points: 0, reason: null };
}

function rateReason(rate: number): string | null {
  if (rate >= 35) return "очень высокая ставка";
  if (rate >= 20) return "высокая ставка";
  if (rate >= 12) return "повышенная ставка";
  if (rate <= 5) return "низкая ставка";
  return null;
}

function kindReason(kind: DebtKind): string | null {
  switch (kind) {
    case "microloan":
      return "микрозайм обычно требует внимания в первую очередь";
    case "credit_card":
      return "кредитная карта с высокой ставкой";
    case "personal_loan":
      return "долг знакомым — мягче по срочности";
    default:
      return null;
  }
}

export function assessDebtPriority(
  input: DebtPriorityInput
): DebtPriorityAssessment {
  const reasons: string[] = [];
  let score = 0;

  if (input.is_overdue) {
    score += 40;
    reasons.push("есть просрочка");
  }

  const ratePoints = Math.min(28, Math.round((input.interest_rate / 40) * 28));
  score += ratePoints;
  const rateText = rateReason(input.interest_rate);
  if (rateText) reasons.push(rateText);

  score += KIND_WEIGHT[input.debt_kind] ?? 8;
  const kindText = kindReason(input.debt_kind);
  if (kindText && input.debt_kind !== "personal_loan") {
    reasons.push(kindText);
  }

  const burden = paymentBurdenScore(
    input.monthly_payment,
    input.monthly_income
  );
  score += burden.points;
  if (burden.reason) reasons.push(burden.reason);

  if (input.remaining_amount >= 500_000) {
    score += 8;
    reasons.push("крупный остаток");
  } else if (input.remaining_amount >= 200_000) {
    score += 4;
  }

  if (input.due_day != null) {
    const days = daysUntilDueDay(input.due_day);
    if (days != null && days <= 7) {
      score += 8;
      reasons.push("ближайший платёж в течение недели");
    }
  }

  if (
    input.debt_kind === "personal_loan" &&
    !input.is_overdue &&
    input.interest_rate <= 0
  ) {
    score = Math.max(0, score - 8);
  }

  score = Math.max(0, Math.min(100, score));
  const level = scoreToLevel(score);

  const uniqueReasons = [...new Set(reasons)].slice(0, 3);
  let explanation: string;

  if (level === "high") {
    explanation =
      uniqueReasons.length > 0
        ? `${LEVEL_LABELS.high}: ${uniqueReasons.join(", ")}.`
        : `${LEVEL_LABELS.high}: высокая ставка и заметная нагрузка на бюджет.`;
  } else if (level === "medium") {
    explanation =
      uniqueReasons.length > 0
        ? `${LEVEL_LABELS.medium}: ${uniqueReasons.join(", ")}.`
        : `${LEVEL_LABELS.medium}: долг без просрочек, но занимает заметную часть бюджета.`;
  } else {
    explanation =
      uniqueReasons.length > 0
        ? `${LEVEL_LABELS.low}: ${uniqueReasons.join(", ")}.`
        : `${LEVEL_LABELS.low}: ставка низкая, платёж не создаёт сильной нагрузки.`;
  }

  return {
    level,
    score,
    label: LEVEL_LABELS[level],
    explanation,
  };
}

export function assessDebtRecord(
  debt: Debt,
  options?: { monthly_income?: number | null }
): DebtPriorityAssessment {
  return assessDebtPriority({
    debt_kind: debt.debt_kind ?? "other",
    interest_rate: debt.interest_rate,
    remaining_amount: debt.remaining_amount,
    monthly_payment: getMonthlyPaymentForAnalysis(debt),
    is_overdue: debt.is_overdue ?? false,
    due_day: debt.due_day,
    monthly_income: options?.monthly_income,
  });
}

export function computeDebtPriorityScore(
  input: DebtPriorityInput
): number {
  return assessDebtPriority(input).score;
}
