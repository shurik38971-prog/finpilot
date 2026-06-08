import type { EscapePlanOption } from "@/types/escape-plan";
import type { EscapeFitLevel } from "@/lib/escape-plan/rank-options";

export function getTop3FitLevel(index: number): EscapeFitLevel {
  if (index <= 1) return "excellent";
  return "good";
}

export function getTop3FitLabel(index: number): string {
  return index <= 1 ? "Подходит отлично" : "Подходит хорошо";
}

export function compactWhyReasons(option: EscapePlanOption, max = 4): string[] {
  const chosen = (option.why_chosen ?? []).map((s) => s.trim()).filter(Boolean);
  if (chosen.length > 0) return chosen.slice(0, max);

  if (option.why_fits) {
    const sentence = option.why_fits.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (sentence) return [sentence];
  }

  return [];
}

export function compactRisk(option: EscapePlanOption, maxLen = 100): string {
  const risk = option.risk?.trim();
  if (!risk) return "умеренный — зависит от исполнения";
  if (risk.length <= maxLen) return risk;
  return `${risk.slice(0, maxLen - 1).trim()}…`;
}
