"use client";

import { completeTask } from "@/lib/actions/tasks";
import type { TaskProgressStats } from "@/lib/actions/tasks";
import { CompactTaskEffects } from "@/components/tasks/compact-task-effects";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { trackButtonClick } from "@/lib/analytics/client";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { HINTS, importanceLabel } from "@/lib/copy/ui";
import { cn, formatCurrency, formatHistoryDate } from "@/lib/utils";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import type { NextBestActionResult } from "@/types/tasks";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const COLLAPSED_STORAGE_KEY = "dashboard_next_action_collapsed";
const TRANSITION_MS = "duration-300";

interface NextBestActionCardProps {
  action: NextBestActionResult | null;
  taskProgress: TaskProgressStats;
  hasNegativeCashflow?: boolean;
}

type CardPhase = "active" | "completed" | "no-more";

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
}

function persistCollapsedPreference(collapsed: boolean) {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
}

function EmptyActionCard({ analyzeOnly = false }: { analyzeOnly?: boolean }) {
  return (
    <Card
      className={cn(
        "border-accent/30 bg-gradient-to-br from-accent/10 to-transparent !p-4",
        TRANSITION_MS,
        "transition-all ease-in-out"
      )}
    >
      <CardHeader className="mb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          {analyzeOnly ? "Нет активных действий" : "Следующее лучшее действие"}
        </CardTitle>
        <CardDescription className="text-xs leading-snug">
          {analyzeOnly
            ? "Сейчас у вас нет важных активных действий. Запустите новый ИИ-анализ."
            : "Запустите ИИ-анализ или создайте цель — FinPilot подскажет одно самое полезное дело."}
        </CardDescription>
      </CardHeader>
      <div className="px-4 pb-4 pt-0 flex gap-2">
        <Link href="/analyze">
          <Button size="sm">
            {analyzeOnly ? "Запустить анализ" : "ИИ-анализ"}
          </Button>
        </Link>
        {!analyzeOnly && (
          <Link href="/actions">
            <Button variant="secondary" size="sm">
              Все действия
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

export function NextBestActionCard({
  action: serverAction,
  taskProgress: initialProgress,
  hasNegativeCashflow,
}: NextBestActionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedReady, setCollapsedReady] = useState(false);
  const [phase, setPhase] = useState<CardPhase>("active");
  const [displayAction, setDisplayAction] = useState(serverAction);
  const [queuedNext, setQueuedNext] = useState<NextBestActionResult | null>(
    null
  );
  const [taskProgress, setTaskProgress] =
    useState<TaskProgressStats>(initialProgress);

  useEffect(() => {
    setCollapsed(readCollapsedPreference());
    setCollapsedReady(true);
  }, []);

  useEffect(() => {
    setTaskProgress(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    if (phase === "active" || phase === "no-more") {
      setDisplayAction(serverAction);
      if (serverAction) {
        setPhase("active");
      } else if (phase === "active") {
        setPhase("no-more");
      }
    }
  }, [serverAction, phase]);

  const setCollapsedState = useCallback((value: boolean) => {
    setCollapsed(value);
    persistCollapsedPreference(value);
  }, []);

  if (!collapsedReady && serverAction) {
    return (
      <Card className="border-accent/40 !p-4 min-h-[72px] animate-pulse">
        <div className="h-4 w-40 rounded bg-surface-hover" />
      </Card>
    );
  }

  if (phase === "completed") {
    return (
      <Card
        className={cn(
          "border-emerald-500/25 bg-emerald-500/5 !p-4",
          TRANSITION_MS,
          "transition-all ease-in-out"
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-medium">Главное действие выполнено</p>
            <p className="text-xs text-muted leading-snug">
              Отличная работа. Это действие уже учтено в вашем финансовом
              плане.
            </p>
            {taskProgress.total > 0 && (
              <p className="text-xs text-muted">
                Выполнено задач:{" "}
                <span className="text-foreground font-medium">
                  {taskProgress.completed} из {taskProgress.total}
                </span>
                <span className="text-muted"> · {taskProgress.percent}%</span>
              </p>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (queuedNext) {
                  setDisplayAction(queuedNext);
                  setQueuedNext(null);
                  setPhase("active");
                  setCollapsedState(false);
                } else {
                  setPhase("no-more");
                }
                router.refresh();
              }}
            >
              Показать следующее действие
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === "no-more" || !displayAction) {
    return <EmptyActionCard analyzeOnly={phase === "no-more"} />;
  }

  const action = displayAction;
  const { reasons, impact } = action;

  async function handleComplete() {
    setLoading(true);
    try {
      const { nextAction, taskProgress: progress } = await completeTask(
        action.id,
        { hasNegativeCashflow }
      );
      setTaskProgress(progress);
      setQueuedNext(nextAction);
      setPhase("completed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    const hasEffect = impact != null || action.financial_impact > 0;

    return (
      <Card
        className={cn(
          "border-accent/30 bg-accent/5 !py-2.5 !px-3 overflow-hidden",
          TRANSITION_MS,
          "transition-all ease-in-out"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted leading-none">
              Следующее действие:
            </p>
            <p className="text-sm font-medium truncate leading-tight mt-0.5">
              {action.title}
            </p>
            {hasEffect && (
              <p className="text-xs mt-1 truncate">
                {impact ? (
                  <CompactTaskEffects impact={impact} variant="inline" />
                ) : (
                  <span className="font-medium text-emerald-400">
                    +{formatCurrency(action.financial_impact)} / мес
                  </span>
                )}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 h-8"
            onClick={() => setCollapsedState(false)}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Развернуть
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "border-accent/40 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent shadow-lg shadow-accent/5 !p-4",
          TRANSITION_MS,
          "transition-all ease-in-out"
        )}
      >
        <CardHeader className="mb-2 pb-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-accent mb-0.5 flex items-center gap-1">
                Главное действие
                <HintTooltip hint={HINTS.mainAction} />
              </p>
              <CardTitle className="text-base md:text-lg leading-snug">
                {action.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted"
                onClick={() => setCollapsedState(true)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Свернуть
              </Button>
              <Badge variant="danger" className="text-[11px]">
                {importanceLabel(action.priority_score)}
              </Badge>
              {action.financial_impact > 0 && (
                <Badge variant="success" className="text-[11px]">
                  +{formatCurrency(action.financial_impact)}/мес
                </Badge>
              )}
            </div>
          </div>

          {action.description && (
            <ExpandableText text={action.description} className="mt-2" />
          )}

          {action.goal && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted max-w-full">
              <Target className="h-3 w-3 shrink-0" />
              <span className="truncate">{action.goal.title}</span>
              <span className="shrink-0">· {GOAL_TYPE_LABELS[action.goal.type]}</span>
            </div>
          )}
        </CardHeader>

        <div className="px-4 pb-4 pt-2 space-y-2.5">
          {impact && <CompactTaskEffects impact={impact} />}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            {action.due_date && (
              <span>до {formatHistoryDate(action.due_date)}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleComplete} disabled={loading}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Выполнено
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                trackButtonClick("nba-why-important", "Почему это важно");
                setWhyOpen(true);
              }}
              disabled={loading}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Почему это важно?
            </Button>
            <Link href="/actions">
              <Button variant="ghost" size="sm">
                Все задачи
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <Modal
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        title="Почему это важно?"
      >
        <p className="text-sm text-muted mb-4">
          Эта задача выбрана потому что:
        </p>
        <ul className="space-y-2">
          {reasons.map((reason) => (
            <li
              key={reason}
              className={cn(
                "flex items-start gap-2 text-sm rounded-lg border border-border/50 px-3 py-2",
                "bg-surface-hover/30"
              )}
            >
              <span className="text-accent mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted">
          FinPilot сравнивает все активные дела и выбирает то, которое сейчас
          принесёт больше всего пользы ({importanceLabel(action.priority_score)}
          ).
        </div>
      </Modal>
    </>
  );
}
