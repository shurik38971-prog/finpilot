"use client";

import {
  completeTask,
  deleteTask,
  postponeTask,
} from "@/lib/actions/tasks";
import { useCopy } from "@/components/copy/site-copy-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatHistoryDate } from "@/lib/utils";
import type { FinancialTaskWithGoal } from "@/types/tasks";
import { TASK_STATUS_LABELS } from "@/types/tasks";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TaskRecommendationModal } from "@/components/feedback/task-recommendation-modal";
import { TaskImpactPreview } from "@/components/tasks/task-impact-preview";
import { TaskRecommendationContext } from "@/components/tasks/task-recommendation-context";
import { getDisplayableTaskImpact } from "@/lib/finance/task-effect-eligibility";
import { sortEscapeRouteTasks } from "@/lib/escape-plan/route-steps";
import { benefitLabel, importanceLabel } from "@/lib/copy/ui";
import { Toast } from "@/components/ui/toast";

function impactVariant(score: number): "danger" | "warning" | "success" | "default" {
  if (score >= 70) return "danger";
  if (score >= 45) return "warning";
  return "default";
}

function GoalBadge({ task }: { task: FinancialTaskWithGoal }) {
  if (!task.goal) return null;

  return (
    <Link
      href="/goals"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex"
    >
      <Badge variant="default" className="gap-1">
        <Target className="h-3 w-3" />
        {task.goal.title}
        <span className="text-muted">· {GOAL_TYPE_LABELS[task.goal.type]}</span>
      </Badge>
    </Link>
  );
}

function statusVariant(
  status: FinancialTaskWithGoal["status"]
): "success" | "warning" | "default" {
  if (status === "done") return "success";
  if (status === "postponed") return "warning";
  return "default";
}

function PrimaryActionCard({
  task,
  loadingId,
  onComplete,
  cleanupMode = false,
}: {
  task: FinancialTaskWithGoal;
  loadingId: string | null;
  onComplete: (id: string) => void;
  cleanupMode?: boolean;
}) {
  const displayImpact = getDisplayableTaskImpact(task);

  return (
    <Card className="border-accent/40 bg-accent/5 mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted mb-1">
              {cleanupMode
                ? "Следующий шаг"
                : `Следующее лучшее действие · ${importanceLabel(task.priority_score)}`}
            </p>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {!cleanupMode && (
              <div className="mt-2">
                <GoalBadge task={task} />
              </div>
            )}
          </div>
          {!cleanupMode && (
            <Badge variant={impactVariant(task.impact_score)}>
              {benefitLabel(task.impact_score, task.impact_label)}
            </Badge>
          )}
        </div>
        {task.description && (
          <CardDescription className="text-sm leading-relaxed">
            {task.description}
          </CardDescription>
        )}
        {cleanupMode && task.explanation && (
          <p className="text-sm text-muted mt-2">
            <span className="text-foreground/80">Ожидаемый результат: </span>
            {task.explanation}
          </p>
        )}
        {!cleanupMode && displayImpact && (
          <div className="mt-3">
            <TaskImpactPreview impact={displayImpact} />
          </div>
        )}
        <TaskRecommendationContext
          title={task.title}
          description={task.description}
          explanation={task.explanation}
          taskCategory={task.task_category}
          className="mt-3"
          compact={cleanupMode}
        />
      </CardHeader>
      <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
        {!cleanupMode && (
          <span className="text-xs text-muted">
            {benefitLabel(task.impact_score, task.impact_label)}
          </span>
        )}
        {task.due_date && (
          <span className="text-xs text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            до {formatHistoryDate(task.due_date)}
          </span>
        )}
        <Button
          size="sm"
          disabled={loadingId === task.id}
          onClick={() => onComplete(task.id)}
        >
          {loadingId === task.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Выполнено
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({
  task,
  loadingId,
  onComplete,
  onPostpone,
  onDelete,
  cleanupMode = false,
}: {
  task: FinancialTaskWithGoal;
  loadingId: string | null;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onDelete: (id: string) => void;
  cleanupMode?: boolean;
}) {
  const isDone = task.status === "done";
  const displayImpact = getDisplayableTaskImpact(task);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start gap-3 p-4 border-b border-border/50 last:border-0",
        isDone && "opacity-70"
      )}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              "font-medium text-sm",
              isDone && "line-through text-muted"
            )}
          >
            {task.title}
          </p>
          <Badge variant={statusVariant(task.status)}>
            {TASK_STATUS_LABELS[task.status]}
          </Badge>
          {!isDone && !cleanupMode && (
            <Badge variant={impactVariant(task.impact_score)}>
              {benefitLabel(task.impact_score, task.impact_label)}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted leading-relaxed">{task.description}</p>
        )}
        {!cleanupMode && <GoalBadge task={task} />}
        {!cleanupMode && displayImpact && (
          <TaskImpactPreview impact={displayImpact} compact />
        )}
        <TaskRecommendationContext
          title={task.title}
          description={task.description}
          explanation={task.explanation}
          taskCategory={task.task_category}
          compact
        />
        <p className="text-xs text-muted">
          {formatHistoryDate(task.created_at.split("T")[0])}
          {task.due_date && ` · срок ${formatHistoryDate(task.due_date)}`}
        </p>
      </div>
      {!isDone && (
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            size="sm"
            disabled={loadingId === task.id}
            onClick={() => onComplete(task.id)}
          >
            {loadingId === task.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Выполнено"
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loadingId === task.id}
            onClick={() => onPostpone(task.id)}
          >
            Отложить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={loadingId === task.id}
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </Button>
        </div>
      )}
    </div>
  );
}

const VISIBLE_ACTIVE_TASKS = 5;

interface ActionsPageClientProps {
  tasks: FinancialTaskWithGoal[];
  additionalTasks?: FinancialTaskWithGoal[];
  cleanupMode?: boolean;
}

export function ActionsPageClient({
  tasks,
  additionalTasks = [],
  cleanupMode = false,
}: ActionsPageClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const orderedTasks = cleanupMode ? sortEscapeRouteTasks(tasks) : tasks;
  const pending = orderedTasks
    .filter((t) => t.status === "pending")
    .sort(
      (a, b) =>
        cleanupMode
          ? 0
          : b.priority_score - a.priority_score ||
            b.impact_score - a.impact_score
    );
  const postponed = orderedTasks.filter((t) => t.status === "postponed");
  const done = orderedTasks.filter((t) => t.status === "done");
  const pendingMeasures = additionalTasks.filter((t) => t.status === "pending");
  const doneMeasures = additionalTasks.filter((t) => t.status === "done");
  const primary = pending[0] ?? null;
  const activeTasks = cleanupMode
    ? postponed
    : pending
        .filter((task) => task.id !== primary?.id)
        .concat(postponed.filter((task) => task.id !== primary?.id));
  const routeComplete =
    cleanupMode &&
    !primary &&
    postponed.length === 0 &&
    done.length > 0 &&
    tasks.length > 0;
  const pageTitle = useCopy("page.actions.title");
  const pageDescription = useCopy(
    cleanupMode ? "page.actions.description_cleanup" : "page.actions.description"
  );

  const hiddenActiveCount = Math.max(
    0,
    activeTasks.length - VISIBLE_ACTIVE_TASKS
  );
  const visibleActiveTasks = showAllActive
    ? activeTasks
    : activeTasks.slice(0, VISIBLE_ACTIVE_TASKS);

  async function runAction(
    id: string,
    action: (id: string) => Promise<unknown>
  ) {
    setLoadingId(id);
    try {
      await action(id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleComplete(id: string) {
    setLoadingId(id);
    try {
      const result = await completeTask(id);
      if (result.askRecommendationFeedback) {
        setFeedbackTaskId(id);
      }
      if (cleanupMode) {
        setToastMessage("Шаг выполнен. Следующий шаг готов.");
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <TaskRecommendationModal
        open={feedbackTaskId != null}
        taskId={feedbackTaskId}
        onClose={() => setFeedbackTaskId(null)}
      />
      <PageHeader title={pageTitle} description={pageDescription} />

      {tasks.length === 0 && additionalTasks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="rounded-full bg-surface-hover p-4 mb-4">
              <Target className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">Шагов пока нет</h3>
            <p className="text-sm text-muted max-w-sm mb-4">
              {cleanupMode
                ? "Пока нет активного маршрута. Пройдите раздел «Выход из ситуации», чтобы получить план."
                : "Запустите ИИ-анализ — FinPilot создаст персональный список дел из разбора."}
            </p>
            <Link href={cleanupMode ? "/escape-plan" : "/analyze"}>
              <Button>
                {cleanupMode ? "Выход из ситуации" : "Запустить ИИ-анализ"}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {routeComplete && (
            <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">
                  Все шаги маршрута выполнены
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Запишите полученный доход в разделе «Доходы» или пересчитайте
                  маршрут в «Выходе из ситуации», если нужен новый план.
                </CardDescription>
              </CardHeader>
              <div className="px-5 pb-5 flex flex-wrap gap-2">
                <Link href="/income">
                  <Button size="sm">Записать доход</Button>
                </Link>
                <Link href="/escape-plan">
                  <Button size="sm" variant="secondary">
                    Выход из ситуации
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {primary && (
            <PrimaryActionCard
              task={primary}
              loadingId={loadingId}
              onComplete={handleComplete}
              cleanupMode={cleanupMode}
            />
          )}

          {activeTasks.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {cleanupMode ? "Отложенные шаги" : "Активные задачи"}
                </CardTitle>
              </CardHeader>
              <div>
                {visibleActiveTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    loadingId={loadingId}
                    onComplete={handleComplete}
                    onPostpone={(id) => runAction(id, postponeTask)}
                    onDelete={(id) => {
                      if (!confirm("Удалить задачу?")) return;
                      runAction(id, deleteTask);
                    }}
                    cleanupMode={cleanupMode}
                  />
                ))}
              </div>
              {hiddenActiveCount > 0 && !showAllActive && (
                <div className="px-5 pb-5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAllActive(true)}
                  >
                    Показать ещё ({hiddenActiveCount})
                  </Button>
                </div>
              )}
            </Card>
          )}

          {done.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">
                  {cleanupMode ? "Выполненные шаги маршрута" : "Выполненные задачи"}
                </CardTitle>
              </CardHeader>
              <div>
                {done.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    loadingId={loadingId}
                    onComplete={() => {}}
                    onPostpone={() => {}}
                    onDelete={(id) => {
                      if (!confirm("Удалить задачу?")) return;
                      runAction(id, deleteTask);
                    }}
                    cleanupMode={cleanupMode}
                  />
                ))}
              </div>
            </Card>
          )}

          {cleanupMode && (pendingMeasures.length > 0 || doneMeasures.length > 0) && (
            <Card className="mt-6 border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Дополнительные действия</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Финансовые меры отдельно от пошагового маршрута доп.дохода.
                </CardDescription>
              </CardHeader>
              <div>
                {[...pendingMeasures, ...doneMeasures].map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    loadingId={loadingId}
                    onComplete={handleComplete}
                    onPostpone={(id) => runAction(id, postponeTask)}
                    onDelete={(id) => {
                      if (!confirm("Удалить задачу?")) return;
                      runAction(id, deleteTask);
                    }}
                    cleanupMode={false}
                  />
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
