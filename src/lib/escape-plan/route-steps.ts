import { buildStepsForRouteType } from "@/lib/escape-plan/route-step-templates";
import { resolveRouteType } from "@/lib/escape-plan/route-types";
import type { EscapePlanOption } from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";

export interface EscapeRouteStep {
  title: string;
  description: string;
  /** User-facing benefit; stored in financial_tasks.explanation */
  why_important: string;
}

/** Canonical ordered steps for income routes. AI steps are not merged to avoid chaotic order. */
export function buildEscapeRouteSteps(option: EscapePlanOption): EscapeRouteStep[] {
  const routeType = resolveRouteType(option);
  return buildStepsForRouteType(routeType, option.title);
}

export function buildEscapeActionSteps(option: EscapePlanOption): string[] {
  return buildEscapeRouteSteps(option).map((s) => s.title);
}

export function getEscapeStepOrder(
  task: Pick<FinancialTask, "order_index" | "normalized_title">
): number {
  if (task.order_index != null && task.order_index > 0) {
    return task.order_index;
  }
  const match = task.normalized_title?.match(/^escape:[^:]+:(\d+)$/);
  if (match) return Number(match[1]) + 1;
  return Number.MAX_SAFE_INTEGER;
}

export function sortEscapeRouteTasks<
  T extends Pick<FinancialTask, "order_index" | "normalized_title">,
>(tasks: T[]): T[] {
  return [...tasks].sort(
    (a, b) => getEscapeStepOrder(a) - getEscapeStepOrder(b)
  );
}

export function splitRouteStepsForPreview(tasks: FinancialTask[]): {
  lastDone: FinancialTask | null;
  nextStep: FinancialTask | null;
  upcoming: FinancialTask[];
} {
  const ordered = sortEscapeRouteTasks(
    tasks.filter((task) => task.status !== "archived")
  );
  const done = ordered.filter((task) => task.status === "done");
  const pending = ordered.filter((task) => task.status === "pending");

  return {
    lastDone: done[done.length - 1] ?? null,
    nextStep: pending[0] ?? null,
    upcoming: pending.slice(1, 4),
  };
}

export { isCashbackPartnerRoute, resolveRouteType } from "@/lib/escape-plan/route-types";
