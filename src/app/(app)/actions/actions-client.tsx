"use client";

import {
  completeTask,
  deleteTask,
  postponeTask,
} from "@/lib/actions/tasks";
import { ensureActiveEscapeRouteSteps } from "@/lib/actions/escape-plans";
import { useCopy } from "@/components/copy/site-copy-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatHistoryDate } from "@/lib/utils";
import type { FinancialTaskWithGoal } from "@/types/tasks";
import { getTaskStatusLabel, type RouteStepQueuePosition } from "@/lib/tasks/status-labels";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import {
  CheckCircle2,
  Clock,
  Database,
  Landmark,
  Loader2,
  TrendingUp,
  Target,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TaskRecommendationModal } from "@/components/feedback/task-recommendation-modal";
import { TaskImpactPreview } from "@/components/tasks/task-impact-preview";
import { TaskRecommendationContext } from "@/components/tasks/task-recommendation-context";
import { getDisplayableTaskImpact } from "@/lib/finance/task-effect-eligibility";
import { sortEscapeRouteTasks } from "@/lib/escape-plan/route-steps";
import { getRoutePracticalGuideForOption } from "@/lib/escape-plan/route-step-guides";
import type { EscapePlanOption } from "@/types/escape-plan";
import { RouteStepPracticalGuide } from "@/components/escape-plan/route-step-practical-guide";
import { benefitLabel } from "@/lib/copy/ui";
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

function RouteCurrentStepCard({
  task,
  routeOption,
  loadingId,
  onComplete,
  onPostpone,
}: {
  task: FinancialTaskWithGoal;
  routeOption: Pick<
    EscapePlanOption,
    "title" | "route_type" | "why_fits" | "first_step" | "type"
  > | null;
  loadingId: string | null;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
}) {
  const practicalGuide = routeOption
    ? getRoutePracticalGuideForOption(routeOption)
    : null;

  return (
    <Card className="border-accent/40 bg-accent/5 mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="text-xs text-muted">Текущий шаг</p>
          <Badge variant="default">Сейчас</Badge>
        </div>
        <CardTitle className="text-lg">{task.title}</CardTitle>
        {task.description && (
          <CardDescription className="text-sm leading-relaxed mt-2 text-foreground/85">
            {task.description}
          </CardDescription>
        )}
        {task.explanation?.trim() && (
          <p className="text-sm text-muted leading-relaxed mt-3">
            <span className="text-foreground/75">Почему это важно: </span>
            {task.explanation.trim()}
          </p>
        )}
      </CardHeader>

      <div className="px-5 pb-4 flex flex-wrap items-center gap-3">
        {task.due_date && (
          <span className="text-xs text-muted flex items-center gap-1 w-full sm:w-auto">
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
          Отметить шаг выполненным
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={loadingId === task.id}
          onClick={() => onPostpone(task.id)}
        >
          Отложить
        </Button>
      </div>

      {practicalGuide && (
        <div className="px-5 pb-5">
          <RouteStepPracticalGuide guide={practicalGuide} />
        </div>
      )}
    </Card>
  );
}

function FutureRouteStepRow({ task }: { task: FinancialTaskWithGoal }) {
  return (
    <div className="p-4 border-b border-border/50 last:border-0 opacity-80">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="font-medium text-sm text-foreground/90">{task.title}</p>
        <Badge variant="default">Дальше</Badge>
      </div>
      {task.description && (
        <p className="text-sm text-muted leading-relaxed">{task.description}</p>
      )}
      <p className="text-xs text-muted/80 mt-2">
        Откроется после выполнения предыдущего шага
      </p>
    </div>
  );
}

function CompletedRouteStepRow({ task }: { task: FinancialTaskWithGoal }) {
  return (
    <div className="p-4 border-b border-border/50 last:border-0 opacity-70">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="font-medium text-sm line-through text-muted">{task.title}</p>
        <Badge variant="success">Выполнено</Badge>
      </div>
      {task.description && (
        <p className="text-xs text-muted leading-relaxed">{task.description}</p>
      )}
    </div>
  );
}

function PostponedRouteStepRow({ task }: { task: FinancialTaskWithGoal }) {
  return (
    <div className="p-4 border-b border-border/50 last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="font-medium text-sm">{task.title}</p>
        <Badge variant="warning">Отложена</Badge>
      </div>
      {task.description && (
        <p className="text-sm text-muted leading-relaxed">{task.description}</p>
      )}
    </div>
  );
}

function TaskRow({
  task,
  loadingId,
  onComplete,
  onPostpone,
  onDelete,
  cleanupMode = false,
  routeStepQueue,
}: {
  task: FinancialTaskWithGoal;
  loadingId: string | null;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onDelete: (id: string) => void;
  cleanupMode?: boolean;
  routeStepQueue?: RouteStepQueuePosition;
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
            {getTaskStatusLabel(task.status, {
              routeStep: cleanupMode ? routeStepQueue : undefined,
            })}
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

type ActionGroupId = "finance" | "income" | "debt" | "data";

interface ActionGroupConfig {
  id: ActionGroupId;
  title: string;
  description: string;
  icon: typeof WalletCards;
  fallbackActions: string[];
}

interface GroupedAction {
  kind: "task" | "fallback";
  id: string;
  task?: FinancialTaskWithGoal;
  title?: string;
}

const ACTION_GROUPS: Record<ActionGroupId, ActionGroupConfig> = {
  finance: {
    id: "finance",
    title: "Финансы",
    description: "Что поможет удержать ситуацию под контролем",
    icon: WalletCards,
    fallbackActions: [
      "Зафиксируйте обязательные траты на ближайшие 30 дней",
      "Отделите расходы, которые можно временно отложить",
    ],
  },
  income: {
    id: "income",
    title: "Доход",
    description: "Что может дать дополнительный запас",
    icon: TrendingUp,
    fallbackActions: [
      "Подберите один реалистичный маршрут дополнительного дохода",
      "Сформулируйте первое простое предложение для клиента или подработки",
    ],
  },
  debt: {
    id: "debt",
    title: "Долги и обязательства",
    description: "Что важно проверить в первую очередь",
    icon: Landmark,
    fallbackActions: [
      "Проверьте, какие платежи обязательны в ближайшие 30 дней",
      "Не берите новые обязательства, пока не появится запас",
    ],
  },
  data: {
    id: "data",
    title: "Данные для точности",
    description: "Что можно добавить позже, чтобы разбор стал точнее",
    icon: Database,
    fallbackActions: [
      "Добавьте регулярные платежи",
      "Добавьте основные расходы и долги, когда будет удобно",
    ],
  },
};

const DATA_TASK_PATTERNS = [
  "добавить доход",
  "добавьте доход",
  "заполнить доход",
  "указать доход",
  "внести доход",
  "добавить расход",
  "добавьте расход",
  "заполнить расход",
  "указать расход",
  "внести расход",
  "добавить долг",
  "добавьте долг",
  "заполнить долг",
  "указать долг",
  "внести долг",
  "добавить платеж",
  "добавить платёж",
  "добавьте платеж",
  "добавьте платёж",
  "регулярные платеж",
  "регулярные платёж",
  "добавить данные",
  "добавьте данные",
  "заполнить профиль",
  "дополнить профиль",
] as const;

const INCOME_PATTERNS = [
  "доход",
  "заработ",
  "клиент",
  "подработ",
  "маршрут",
  "предложение",
  "услуг",
  "продаж",
] as const;

const DEBT_PATTERNS = [
  "долг",
  "кредит",
  "займ",
  "платеж",
  "платёж",
  "обязательств",
  "реструктур",
  "просроч",
] as const;

const FINANCE_PATTERNS = [
  "бюджет",
  "расход",
  "трата",
  "подушка",
  "резерв",
  "запас",
  "контроль",
  "свободн",
] as const;

function textIncludesAny(text: string, patterns: readonly string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function taskText(task: FinancialTaskWithGoal) {
  return [
    task.title,
    task.description,
    task.explanation,
    task.task_category,
    task.normalized_title,
    task.goal?.title,
    task.goal?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function classifyActionTask(task: FinancialTaskWithGoal): ActionGroupId {
  const category = task.task_category;
  const text = taskText(task);

  if (textIncludesAny(text, DATA_TASK_PATTERNS)) return "data";
  if (category === "debt_negotiation" || task.goal?.type === "debt_payoff") {
    return "debt";
  }
  if (category === "increase_income" || textIncludesAny(text, INCOME_PATTERNS)) {
    return "income";
  }
  if (textIncludesAny(text, DEBT_PATTERNS)) return "debt";
  if (
    category === "budget_control" ||
    category === "cut_optional_spending" ||
    category === "emergency_fund" ||
    textIncludesAny(text, FINANCE_PATTERNS)
  ) {
    return "finance";
  }

  return "finance";
}

function buildGroupedActions(tasks: FinancialTaskWithGoal[]) {
  const grouped: Record<ActionGroupId, GroupedAction[]> = {
    finance: [],
    income: [],
    debt: [],
    data: [],
  };

  for (const task of tasks) {
    const groupId = classifyActionTask(task);
    if (grouped[groupId].length >= 2) continue;
    grouped[groupId].push({
      kind: "task",
      id: task.id,
      task,
    });
  }

  const hasRealDebtOrFinance =
    grouped.debt.some((item) => item.kind === "task") ||
    grouped.finance.some((item) => item.kind === "task");
  const groupOrder: ActionGroupId[] = hasRealDebtOrFinance
    ? ["debt", "finance", "income", "data"]
    : ["finance", "income", "debt", "data"];

  for (const groupId of groupOrder) {
    if (grouped[groupId].length > 0) continue;
    grouped[groupId] = ACTION_GROUPS[groupId].fallbackActions
      .slice(0, 2)
      .map((title, index) => ({
        kind: "fallback",
        id: `${groupId}-fallback-${index}`,
        title,
      }));
  }

  return groupOrder
    .map((groupId) => ({
      config: ACTION_GROUPS[groupId],
      items: grouped[groupId].slice(0, 2),
    }))
    .filter((group) => group.items.length > 0);
}

function FallbackActionRow({ title }: { title: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/50 p-4 last:border-0">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs text-muted">
        •
      </span>
      <p className="text-sm leading-relaxed text-muted">{title}</p>
    </div>
  );
}

function GroupedActionsRoute({
  tasks,
  loadingId,
  onComplete,
  onPostpone,
  onDelete,
}: {
  tasks: FinancialTaskWithGoal[];
  loadingId: string | null;
  onComplete: (id: string) => void;
  onPostpone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const groups = buildGroupedActions(tasks);

  return (
    <div className="mb-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Что делать сейчас</h2>
        <p className="mt-1 text-sm text-muted">
          Маршрут собран по смыслу: сначала самое практичное, затем то, что
          можно уточнить позже.
        </p>
      </div>

      <div className="grid gap-4">
        {groups.map(({ config, items }) => {
          const Icon = config.icon;

          return (
            <Card key={config.id} className="overflow-hidden !p-0">
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-accent/10 p-2 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{config.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div>
                {items.map((item) =>
                  item.kind === "task" && item.task ? (
                    <TaskRow
                      key={item.id}
                      task={item.task}
                      loadingId={loadingId}
                      onComplete={onComplete}
                      onPostpone={onPostpone}
                      onDelete={onDelete}
                      cleanupMode={false}
                    />
                  ) : (
                    <FallbackActionRow key={item.id} title={item.title ?? ""} />
                  )
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface ActionsPageClientProps {
  tasks: FinancialTaskWithGoal[];
  additionalTasks?: FinancialTaskWithGoal[];
  cleanupMode?: boolean;
  hasActiveRoute?: boolean;
  activeRouteOption?: EscapePlanOption | null;
}

export function ActionsPageClient({
  tasks,
  additionalTasks = [],
  cleanupMode = false,
  hasActiveRoute = false,
  activeRouteOption = null,
}: ActionsPageClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ensuringSteps, setEnsuringSteps] = useState(false);

  const orderedTasks = cleanupMode ? sortEscapeRouteTasks(tasks) : tasks;
  const pending = cleanupMode
    ? orderedTasks.filter((t) => t.status === "pending")
    : orderedTasks
        .filter((t) => t.status === "pending")
        .sort(
          (a, b) =>
            b.priority_score - a.priority_score ||
            b.impact_score - a.impact_score
        );
  const postponed = orderedTasks.filter((t) => t.status === "postponed");
  const done = cleanupMode
    ? sortEscapeRouteTasks(orderedTasks.filter((t) => t.status === "done"))
    : orderedTasks.filter((t) => t.status === "done");
  const pendingMeasures = additionalTasks.filter((t) => t.status === "pending");
  const doneMeasures = additionalTasks.filter((t) => t.status === "done");
  const primary = pending[0] ?? null;
  const futureRouteSteps = cleanupMode ? pending.slice(1) : [];
  const activeTasks = cleanupMode
    ? postponed
    : pending.concat(postponed);
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось отметить шаг выполненным";
      setToastMessage(message);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleEnsureRouteSteps() {
    setEnsuringSteps(true);
    try {
      await ensureActiveEscapeRouteSteps();
      router.refresh();
    } finally {
      setEnsuringSteps(false);
    }
  }

  const showRouteNotSelected = cleanupMode && !hasActiveRoute;
  const showRouteMissingSteps =
    cleanupMode && hasActiveRoute && tasks.length === 0;
  const showEmpty =
    !showRouteNotSelected &&
    tasks.length === 0 &&
    additionalTasks.length === 0 &&
    !showRouteMissingSteps;

  return (
    <div>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <TaskRecommendationModal
        open={feedbackTaskId != null}
        taskId={feedbackTaskId}
        onClose={() => setFeedbackTaskId(null)}
      />
      <PageHeader title={pageTitle} description={pageDescription} />

      {showRouteNotSelected ? (
        <>
          <Card>
            <div className="flex flex-col items-center py-16 text-center px-6">
              <div className="rounded-full bg-surface-hover p-4 mb-4">
                <Target className="h-8 w-8 text-muted" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                Сначала выберите направление, с которого хотите начать.
              </h3>
              <Link href="/escape-plan" className="mt-4">
                <Button>Выбрать направление</Button>
              </Link>
            </div>
          </Card>
        </>
      ) : showEmpty ? (
        <Card>
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="rounded-full bg-surface-hover p-4 mb-4">
              <Target className="h-8 w-8 text-muted" />
            </div>
            <h3 className="text-lg font-medium mb-1">Шагов пока нет</h3>
            <p className="text-sm text-muted max-w-sm mb-4">
              {cleanupMode
                ? "Пока нет активного маршрута. Пройдите раздел «Выход из ситуации», чтобы получить план."
                : "Запустите финансовый разбор — ФинПилот создаст персональный список дел из разбора."}
            </p>
            <Link href={cleanupMode ? "/escape-plan" : "/analyze"}>
              <Button>
                {cleanupMode ? "Выход из ситуации" : "Запустить разбор"}
              </Button>
            </Link>
          </div>
        </Card>
      ) : showRouteMissingSteps ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Маршрут найден, но шаги не сформированы</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Активный маршрут есть в «Выходе из ситуации», но пошаговый план ещё не
                синхронизирован с этим разделом.
              </CardDescription>
            </CardHeader>
            <div className="px-5 pb-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void handleEnsureRouteSteps()}
                disabled={ensuringSteps}
              >
                {ensuringSteps ? "Формирование..." : "Сформировать шаги маршрута"}
              </Button>
              <Link href="/escape-plan">
                <Button size="sm" variant="secondary">
                  Выход из ситуации
                </Button>
              </Link>
            </div>
          </Card>

          {cleanupMode && (pendingMeasures.length > 0 || doneMeasures.length > 0) && (
            <Card className="border-border/80">
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
      ) : (
        <>
          {routeComplete && (
            <Card className="mb-6 border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">
                  Маршрут выполнен
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Запишите полученный доход и пересчитайте прогресс.
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

          {cleanupMode ? (
            <>
              {primary && (
                <RouteCurrentStepCard
                  task={primary}
                  routeOption={activeRouteOption}
                  loadingId={loadingId}
                  onComplete={handleComplete}
                  onPostpone={(id) => runAction(id, postponeTask)}
                />
              )}

              {futureRouteSteps.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Дальше по маршруту</CardTitle>
                    <CardDescription className="text-sm">
                      Следующие шаги откроются по очереди после текущего.
                    </CardDescription>
                  </CardHeader>
                  <div>
                    {futureRouteSteps.map((task) => (
                      <FutureRouteStepRow key={task.id} task={task} />
                    ))}
                  </div>
                </Card>
              )}

              {postponed.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base">Отложенные шаги</CardTitle>
                  </CardHeader>
                  <div>
                    {postponed.map((task) => (
                      <PostponedRouteStepRow key={task.id} task={task} />
                    ))}
                  </div>
                </Card>
              )}

              {done.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base text-emerald-400">
                      Выполненные шаги
                    </CardTitle>
                  </CardHeader>
                  <div>
                    {done.map((task) => (
                      <CompletedRouteStepRow key={task.id} task={task} />
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <GroupedActionsRoute
                  tasks={activeTasks}
                  loadingId={loadingId}
                  onComplete={handleComplete}
                  onPostpone={(id) => runAction(id, postponeTask)}
                  onDelete={(id) => {
                    if (!confirm("Удалить задачу?")) return;
                    runAction(id, deleteTask);
                  }}
                />
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
                        cleanupMode={false}
                      />
                    ))}
                  </div>
                </Card>
              )}
            </>
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
