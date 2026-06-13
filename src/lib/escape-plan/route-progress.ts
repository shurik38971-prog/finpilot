import type { FinancialTask } from "@/types/tasks";

export function computeRouteStepProgress(tasks: FinancialTask[]): {
  percent: number;
  completed: number;
  total: number;
} {
  const active = tasks.filter((task) => task.status !== "archived");
  const total = active.length;
  if (total === 0) {
    return { percent: 0, completed: 0, total: 0 };
  }

  const completed = active.filter((task) => task.status === "done").length;
  return {
    percent: Math.round((completed / total) * 100),
    completed,
    total,
  };
}
