import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS } from "@/lib/copy/ui";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import type { PrimaryGoalFocus } from "@/types/tasks";
import { CompactTaskEffects } from "@/components/tasks/compact-task-effects";
import { TaskRecommendationContext } from "@/components/tasks/task-recommendation-context";
import { getDisplayableTaskImpact } from "@/lib/finance/task-effect-eligibility";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Target } from "lucide-react";
import Link from "next/link";

interface GoalFocusCardProps {
  focus: PrimaryGoalFocus | null;
}

export function GoalFocusCard({ focus }: GoalFocusCardProps) {
  if (!focus) {
    return (
      <Card className="border-accent/20 !p-4">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-accent" />
            Цель
            <HintTooltip hint={HINTS.goal} />
          </CardTitle>
          <CardDescription className="text-xs leading-snug">
            Задайте цель и запустите ИИ-разбор.
          </CardDescription>
        </CardHeader>
        <div className="px-4 pb-4 pt-0 flex gap-2">
          <Link href="/goals">
            <Button variant="secondary" size="sm">
              Создать цель
            </Button>
          </Link>
          <Link href="/actions">
            <Button size="sm">К действиям</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const { goal, task, remaining, progressPercent, taskImpact } = focus;
  const rawImpact = taskImpact ?? task?.impact ?? null;
  const impact =
    task && rawImpact ? getDisplayableTaskImpact({ ...task, impact: rawImpact }) : null;

  return (
    <Card className="border-accent/30 bg-accent/5 !p-4">
      <CardHeader className="mb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted uppercase tracking-wide">
              {GOAL_TYPE_LABELS[goal.type]}
            </p>
            <CardTitle className="text-sm flex items-center gap-1.5 mt-0.5">
              <Target className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="truncate">{goal.title}</span>
              <HintTooltip hint={HINTS.goal} />
            </CardTitle>
          </div>
          <Badge variant="default" className="shrink-0 text-xs">
            {progressPercent}%
          </Badge>
        </div>

        <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progressPercent >= 100 ? "bg-emerald-400" : "bg-accent"
            )}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>

        <CardDescription className="text-xs mt-0">
          Осталось {formatCurrency(remaining)} из {formatCurrency(goal.target_amount)}
        </CardDescription>
      </CardHeader>

      <div className="px-4 pb-4 pt-0 space-y-3">
        {task ? (
          <div className="rounded-lg border border-border/60 bg-surface-hover/20 px-3 py-2.5 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Главное действие
            </p>
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            {task.description && (
              <ExpandableText text={task.description} />
            )}
            {impact && <CompactTaskEffects impact={impact} />}
            <TaskRecommendationContext
              title={task.title}
              description={task.description}
              explanation={task.explanation}
              compact
            />
          </div>
        ) : (
          <p className="text-xs text-muted">
            Нет активных задач для этой цели. Запустите ИИ-анализ.
          </p>
        )}

        <div className="flex gap-2">
          <Link href="/actions">
            <Button size="sm">Что делать</Button>
          </Link>
          <Link href="/goals">
            <Button variant="secondary" size="sm">
              Все цели
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
