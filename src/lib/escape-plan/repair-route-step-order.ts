import type { EscapePlanOption } from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";
import { buildEscapeRouteSteps } from "@/lib/escape-plan/route-steps";

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreRouteStepTitleMatch(
  taskTitle: string,
  canonicalTitle: string
): number {
  const a = normalizeTitle(taskTitle);
  const b = normalizeTitle(canonicalTitle);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const aWords = new Set(a.split(" ").filter((word) => word.length > 3));
  const bWords = b.split(" ").filter((word) => word.length > 3);
  if (bWords.length === 0) return 0;

  let overlap = 0;
  for (const word of bWords) {
    if (aWords.has(word)) overlap += 1;
  }
  return overlap / bWords.length;
}

const MATCH_THRESHOLD = 0.35;

export function pickRouteStepAssignments(
  tasks: FinancialTask[],
  option: EscapePlanOption
): Map<string, number> {
  const canonical = buildEscapeRouteSteps(option);
  const assignments = new Map<string, number>();
  const used = new Set<string>();

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return -1;
    if (b.status === "done" && a.status !== "done") return 1;
    return 0;
  });

  for (let index = 0; index < canonical.length; index += 1) {
    const canonicalStep = canonical[index];
    let best: { id: string; score: number } | null = null;

    for (const task of sortedTasks) {
      if (used.has(task.id)) continue;
      const score = scoreRouteStepTitleMatch(task.title, canonicalStep.title);
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
        best = { id: task.id, score };
      }
    }

    if (best) {
      used.add(best.id);
      assignments.set(best.id, index + 1);
    }
  }

  return assignments;
}

function routeStepContentMatches(
  task: FinancialTask,
  canonicalStep: ReturnType<typeof buildEscapeRouteSteps>[number]
): boolean {
  return (
    task.description === canonicalStep.description &&
    task.explanation === canonicalStep.why_important
  );
}

export function needsRouteStepOrderRepair(
  tasks: FinancialTask[],
  option: EscapePlanOption
): boolean {
  const canonical = buildEscapeRouteSteps(option);
  const active = tasks.filter((task) => task.status !== "archived");
  if (active.length === 0) return false;

  if (active.length !== canonical.length) return true;
  if (active.some((task) => task.order_index == null)) return true;

  const assignments = pickRouteStepAssignments(active, option);
  if (assignments.size !== canonical.length) return true;

  const ordered = [...active].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
  for (let i = 0; i < ordered.length; i += 1) {
    if (ordered[i].order_index !== i + 1) return true;
    const canonicalStep = canonical[i];
    const canonicalTitle = canonicalStep?.title ?? "";
    if (
      scoreRouteStepTitleMatch(ordered[i].title, canonicalTitle) < MATCH_THRESHOLD
    ) {
      return true;
    }
    if (canonicalStep && !routeStepContentMatches(ordered[i], canonicalStep)) {
      return true;
    }
  }

  for (const [taskId, orderIndex] of assignments) {
    const task = active.find((row) => row.id === taskId);
    const canonicalStep = canonical[orderIndex - 1];
    if (task && canonicalStep && !routeStepContentMatches(task, canonicalStep)) {
      return true;
    }
  }

  return false;
}
