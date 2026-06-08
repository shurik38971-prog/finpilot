import type { EscapePlanConfidence, EscapePlanOption } from "@/types/escape-plan";

const CONFIDENCE_WEIGHT: Record<EscapePlanConfidence, number> = {
  high: 300,
  medium: 200,
  low: 100,
};

/** Higher score = show earlier: confidence, then speed, then income potential */
export function scoreEscapeOption(option: EscapePlanOption): number {
  const confidence = CONFIDENCE_WEIGHT[option.confidence] ?? 200;
  const speed = Math.max(0, 100 - (option.priority_rank ?? 5) * 10);
  const income = option.income_max > 0 ? Math.min(option.income_max / 1000, 80) : 0;
  return confidence + speed + income;
}

export function sortEscapePlanOptions(
  options: EscapePlanOption[]
): EscapePlanOption[] {
  return [...options].sort((a, b) => {
    const rankA = a.priority_rank ?? 99;
    const rankB = b.priority_rank ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return scoreEscapeOption(b) - scoreEscapeOption(a);
  });
}
