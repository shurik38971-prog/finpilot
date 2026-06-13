import type { EscapePlanOption } from "@/types/escape-plan";

export type RecommendationType =
  | "income_route"
  | "financial_measure"
  | "quick_action";

export function getRecommendationType(
  option: Pick<EscapePlanOption, "type">
): RecommendationType {
  if (option.type === "increase_income") return "income_route";
  return "financial_measure";
}

export function isIncomeRouteOption(
  option: Pick<EscapePlanOption, "type">
): boolean {
  return getRecommendationType(option) === "income_route";
}

export function isFinancialMeasureOption(
  option: Pick<EscapePlanOption, "type">
): boolean {
  return getRecommendationType(option) === "financial_measure";
}

export function partitionEscapePlanOptions(options: EscapePlanOption[]): {
  incomeRoutes: EscapePlanOption[];
  financialMeasures: EscapePlanOption[];
} {
  const incomeRoutes: EscapePlanOption[] = [];
  const financialMeasures: EscapePlanOption[] = [];

  for (const option of options) {
    if (isIncomeRouteOption(option)) {
      incomeRoutes.push(option);
    } else {
      financialMeasures.push(option);
    }
  }

  return { incomeRoutes, financialMeasures };
}

export function measureTaskKey(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `measure:${slug || "item"}`;
}
