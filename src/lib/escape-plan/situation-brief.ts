import { formatCurrency } from "@/lib/utils";
import type { EscapePlanResult } from "@/types/escape-plan";

export const ESCAPE_VISIBLE_OPTIONS = 3;

function firstSentences(text: string, max: number): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function buildSituationBrief(
  plan: EscapePlanResult,
  topOptionTitle?: string | null
): string[] {
  const lines: string[] = [];
  const fromAi = firstSentences(plan.situation_summary, 2);

  if (fromAi[0]) {
    lines.push(fromAi[0]);
  }

  if (plan.needed_amount > 0) {
    lines.push(
      `Чтобы быстрее двигаться к целям, желательно найти или освободить около ${formatCurrency(plan.needed_amount)} в месяц.`
    );
  } else if (fromAi[1]) {
    lines.push(fromAi[1]);
  }

  const direction = topOptionTitle ?? plan.main_strategy;
  if (direction) {
    const normalized = direction.endsWith(".") ? direction : `${direction}.`;
    lines.push(
      normalized.startsWith("Лучшее")
        ? normalized
        : `Лучшее направление по вашим данным — ${direction.replace(/\.$/, "")}.`
    );
  }

  return lines.slice(0, 3);
}
