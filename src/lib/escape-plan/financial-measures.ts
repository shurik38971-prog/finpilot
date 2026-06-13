import {
  isFinancialMeasureOption,
  measureTaskKey,
} from "@/lib/escape-plan/recommendation-types";
import type { EscapePlanOption } from "@/types/escape-plan";
import type { TaskCategory } from "@/types/tasks";

const MEASURE_TASK_CATEGORY: Record<string, TaskCategory> = {
  reduce_expenses: "cut_optional_spending",
  debt_action: "debt_negotiation",
};

export function buildFinancialMeasureTaskRow(
  userId: string,
  option: EscapePlanOption
) {
  const category =
    MEASURE_TASK_CATEGORY[option.type] ?? ("other" as TaskCategory);

  return {
    user_id: userId,
    title: option.title,
    description:
      option.first_step?.trim() ||
      option.why_fits?.trim() ||
      `Первый шаг по мере «${option.title}».`,
    explanation:
      option.why_fits?.trim() ||
      "Это поможет быстрее закрыть финансовый разрыв без смены основного маршрута доп.дохода.",
    impact_score: Math.min(90, 50 + Math.round((option.expected_effect ?? 0) / 1000)),
    impact_label: "Заметно поможет",
    priority_score: 400,
    financial_impact: option.expected_effect ?? 0,
    task_category: category,
    escape_plan_id: null,
    normalized_title: measureTaskKey(option.title),
    status: "pending" as const,
  };
}

export function filterFinancialMeasureOptions(
  options: EscapePlanOption[]
): EscapePlanOption[] {
  return options.filter(isFinancialMeasureOption);
}
