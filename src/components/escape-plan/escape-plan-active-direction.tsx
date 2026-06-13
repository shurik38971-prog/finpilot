"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { EscapePlanFailureFeedback } from "@/components/escape-plan/escape-plan-failure-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { completeTask } from "@/lib/actions/tasks";
import type { UserEscapePlan } from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EscapePlanActiveDirectionProps {
  activePlan: UserEscapePlan;
  steps: FinancialTask[];
  onFailed: (updated: UserEscapePlan) => void;
}

export function EscapePlanActiveDirection({
  activePlan,
  steps,
  onFailed,
}: EscapePlanActiveDirectionProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showFailureForm, setShowFailureForm] = useState(false);
  const pendingSteps = steps.filter(
    (s) => s.escape_plan_id === activePlan.id && s.status === "pending"
  );
  const allSteps = steps.filter(
    (s) => s.escape_plan_id === activePlan.id && s.status !== "archived"
  );
  const activeGoalLabel = useCopy("escape.active_goal");
  const directionLabel = useCopy("escape.direction_label");
  const actionPlanLabel = useCopy("escape.action_plan");
  const doneLabel = useCopy("btn.done");
  const allActionsLabel = useCopy("btn.all_actions");
  const failedLabel = useCopy("btn.failed");

  async function handleComplete(id: string) {
    setLoadingId(id);
    try {
      await completeTask(id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader className="space-y-4">
        <div>
          <p className="text-xs text-muted mb-1">{activeGoalLabel}</p>
          <CardTitle className="text-lg">
            {activePlan.active_goal ?? activePlan.option_title}
          </CardTitle>
          <CardDescription className="mt-1">
            {directionLabel} {activePlan.option_title}
          </CardDescription>
        </div>

        {allSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{actionPlanLabel}</p>
            <ul className="space-y-2">
              {allSteps.map((step) => {
                const done = step.status === "done";
                return (
                  <li
                    key={step.id}
                    className="flex items-start justify-between gap-3 text-sm rounded-lg border border-border/50 bg-surface/50 p-3"
                  >
                    <span className={done ? "line-through text-muted" : ""}>
                      {done ? "☑" : "□"} {step.title}
                    </span>
                    {!done && step.status === "pending" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={loadingId === step.id}
                        onClick={() => handleComplete(step.id)}
                        className="shrink-0"
                      >
                        {loadingId === step.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="size-4" />
                            {doneLabel}
                          </>
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {pendingSteps.length === 0 && allSteps.length > 0 && (
          <p className="text-sm text-emerald-400">
            Все шаги выполнены — зафиксируйте результат в доходах.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/actions">
            <Button size="sm">{allActionsLabel}</Button>
          </Link>
          {!showFailureForm && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted"
              onClick={() => setShowFailureForm(true)}
            >
              {failedLabel}
            </Button>
          )}
        </div>

        {showFailureForm && (
          <EscapePlanFailureFeedback
            planId={activePlan.id}
            onReported={(updated) => {
              setShowFailureForm(false);
              onFailed(updated);
            }}
          />
        )}
      </CardHeader>
    </Card>
  );
}
