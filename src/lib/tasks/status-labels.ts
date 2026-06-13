import type { TaskStatus } from "@/types/tasks";

export type RouteStepQueuePosition = "current" | "queued";

export function getTaskStatusLabel(
  status: TaskStatus,
  options?: { routeStep?: RouteStepQueuePosition }
): string {
  switch (status) {
    case "done":
      return "Выполнена";
    case "postponed":
      return "Отложена";
    case "archived":
      return "В архиве";
    case "pending":
      if (options?.routeStep === "current") return "Следующий";
      if (options?.routeStep === "queued") return "В очереди";
      return "Активна";
  }
}
