import {
  rankAndSortEscapePlanOptions,
  type EscapePlanRankingContext,
} from "@/lib/escape-plan/rank-options";
import type { EscapePlanOption } from "@/types/escape-plan";

export type { EscapePlanRankingContext } from "@/lib/escape-plan/rank-options";

/** @deprecated use rankAndSortEscapePlanOptions with user context */
export function scoreEscapeOption(option: EscapePlanOption): number {
  return option.rank_score ?? 0;
}

export function sortEscapePlanOptions(
  options: EscapePlanOption[],
  context?: EscapePlanRankingContext
): EscapePlanOption[] {
  if (context && context.skills.length > 0) {
    return rankAndSortEscapePlanOptions(options, context);
  }

  return [...options].sort((a, b) => {
    const scoreDiff = (b.rank_score ?? 0) - (a.rank_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const rankA = a.priority_rank ?? 99;
    const rankB = b.priority_rank ?? 99;
    return rankA - rankB;
  });
}
