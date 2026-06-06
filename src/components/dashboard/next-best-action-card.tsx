"use client";

import { completeTask } from "@/lib/actions/tasks";
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
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NextBestActionCardProps {
  action: NextBestActionResult | null;
}

export function NextBestActionCard({ action }: NextBestActionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  if (!action) {
    return (
      <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent !p-4">
        <CardHeader className="mb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Следующее лучшее действие
          </CardTitle>
          <CardDescription className="text-xs leading-snug">
            Запустите ИИ-анализ или создайте цель — FinPilot подскажет одно
            самое полезное дело.
          </CardDescription>
        </CardHeader>
        <div className="px-4 pb-4 pt-0 flex gap-2">
          <Link href="/analyze">
            <Button size="sm">ИИ-анализ</Button>
          </Link>
          <Link href="/actions">
            <Button variant="secondary" size="sm">
              Все действия
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const { reasons, impact } = action;

  async function handleComplete() {
    setLoading(true);
    try {
      await completeTask(action!.id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-accent/40 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent shadow-lg shadow-accent/5 !p-4">
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
            <div className="flex flex-wrap gap-1.5 shrink-0">
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
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted">
              <Target className="h-3 w-3" />
              <span className="truncate">{action.goal.title}</span>
              <span>· {GOAL_TYPE_LABELS[action.goal.type]}</span>
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
