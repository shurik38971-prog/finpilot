"use client";

import { EscapePlanFailureFeedback } from "@/components/escape-plan/escape-plan-failure-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { UserEscapePlan } from "@/types/escape-plan";
import type { RescueProgressSnapshot } from "@/types/rescue-plan";
import type { FinancialTask } from "@/types/tasks";
import Link from "next/link";
import { useState } from "react";

interface EscapePlanActiveRouteBlockProps {
  activePlan: UserEscapePlan;
  steps: FinancialTask[];
  mainFinancialGoal?: string;
  progress: RescueProgressSnapshot;
  onFailed: (updated: UserEscapePlan) => void;
}

export function EscapePlanActiveRouteBlock({
  activePlan,
  steps,
  mainFinancialGoal,
  progress,
  onFailed,
}: EscapePlanActiveRouteBlockProps) {
  const [showFailureForm, setShowFailureForm] = useState(false);
  const routeSteps = steps.filter(
    (step) => step.escape_plan_id === activePlan.id && step.status !== "archived"
  );
  const nextStep =
    routeSteps.find((step) => step.status === "pending") ?? null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Активный маршрут</h2>
      <Card className="border-accent/40 bg-accent/5">
        <CardHeader className="space-y-4">
          {mainFinancialGoal && (
            <div>
              <p className="text-xs text-muted">Цель</p>
              <p className="text-base font-semibold">{mainFinancialGoal}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted">Маршрут</p>
            <CardTitle className="text-lg">
              {activePlan.active_goal ?? activePlan.option_title}
            </CardTitle>
            <CardDescription className="mt-1">
              {activePlan.option_title}
            </CardDescription>
          </div>

          {nextStep && (
            <p className="text-sm rounded-lg border border-border/50 bg-surface/50 p-3">
              <span className="text-muted">Следующий шаг: </span>
              {nextStep.title}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Прогресс маршрута</span>
              <span className="font-semibold">{progress.percent}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          {progress.monthlyGap > 0 && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border/50 p-3">
                <dt className="text-muted">Доп. доход найден</dt>
                <dd className="font-semibold text-emerald-400 mt-1">
                  +{formatCurrency(progress.incomeFound)} / мес
                </dd>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <dt className="text-muted">Осталось найти</dt>
                <dd className="font-semibold mt-1">
                  +{formatCurrency(progress.remaining)} / мес
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap gap-2">
            <Link href="/actions">
              <Button size="sm">Перейти к шагам</Button>
            </Link>
            {!showFailureForm && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted"
                onClick={() => setShowFailureForm(true)}
              >
                Не получилось
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
    </section>
  );
}
