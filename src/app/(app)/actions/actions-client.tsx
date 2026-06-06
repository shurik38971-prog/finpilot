"use client";

import {
  completeTask,
  deleteTask,
  postponeTask,
} from "@/lib/actions/tasks";
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
import { benefitLabel, importanceLabel } from "@/lib/copy/ui";

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
}: {
  task: FinancialTaskWithGoal;
  loadingId: string | null;
  onComplete: (id: string) => void;
}) {
  return (
    <Card className="border-accent/40 bg-accent/5 mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted mb-1">
              Следующее лучшее действие · {importanceLabel(task.priority_score)}
            </p>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <div className="mt-2">
              <GoalBadge task={task} />
            </div>
          </div>
          <Badge variant={impactVariant(task.impact_score)}>
            {benefitLabel(task.impact_score, task.impact_label)}
          </Badge>
        </div>
        {task.description && (
          <CardDescription className="text-sm leading-relaxed">
            {task.description}
          </CardDescription>
        )}
        {task.impact && (
          <div className="mt-3">
            <TaskImpactPreview impact={task.impact} />
          </div>
        )}
      </CardHeader>
      <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">
          {benefitLabel(task.impact_score, task.impact_label)}
        </span>
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
}: {
  task: FinancialTaskWithGoal;
  loadingId: string | null;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === "done";

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
          {!isDone && (
            <Badge variant={impactVariant(task.impact_score)}>
              {benefitLabel(task.impact_score, task.impact_label)}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted leading-relaxed">{task.description}</p>
        )}
        <GoalBadge task={task} />
        {task.impact && <TaskImpactPreview impact={task.impact} />}
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
}

export function ActionsPageClient({ tasks }: ActionsPageClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);

  const pending = tasks
    .filter((t) => t.status === "pending")
    .sort(
      (a, b) =>
        b.priority_score - a.priority_score ||
        b.impact_score - a.impact_score
    );
  const postponed = tasks.filter((t) => t.status === "postponed");
  const done = tasks.filter((t) => t.status === "done");
  const primary = pending[0] ?? null;
  const activeTasks = pending
    .filter((task) => task.id !== primary?.id)
    .concat(postponed.filter((task) => task.id !== primary?.id));
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
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <TaskRecommendationModal
        open={feedbackTaskId != null}
        taskId={feedbackTaskId}
        onClose={() => setFeedbackTaskId(null)}
      />
      <PageHeader
        title="Что делать сейчас"
        description="Дела из ИИ-разбора — сначала самое важное, потом остальное"
      />

      {tasks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="rounded-full bg-surface-hover p-4 mb-4">
              <Target className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">Задач пока нет</h3>
            <p className="text-sm text-muted max-w-sm mb-4">
              Запустите ИИ-анализ — FinPilot создаст персональный список
              дел из разбора.
            </p>
            <Link href="/analyze">
              <Button>Запустить ИИ-анализ</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {primary && (
            <PrimaryActionCard
              task={primary}
              loadingId={loadingId}
              onComplete={handleComplete}
            />
          )}

          {activeTasks.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Активные задачи</CardTitle>
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
                  Выполненные задачи
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
