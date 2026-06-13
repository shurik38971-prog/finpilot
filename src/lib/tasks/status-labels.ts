import type { TaskStatus } from "@/types/tasks";

export type RouteStepQueuePosition = "current" | "queued";

export function getTaskStatusLabel(
  status: TaskStatus,
  options?: { routeStep?: RouteStepQueuePosition }
): string {
  switch (status) {
    case "done":
      return options?.routeStep !== undefined ? "Выполнено" : "Выполнена";
    case "postponed":
      return "Отложена";
    case "archived":
      return "В архиве";
    case "pending":
      if (options?.routeStep === "current") return "Сейчас";
      if (options?.routeStep === "queued") return "Дальше";
      return "Активна";
  }
}
