"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RescueProgressSnapshot } from "@/types/rescue-plan";

interface RescueProgressCardProps {
  progress: RescueProgressSnapshot;
  activeGoal?: string | null;
}

export function RescueProgressCard({
  progress,
  activeGoal,
}: RescueProgressCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <p className="text-xs text-muted mb-1">Прогресс</p>
          <CardTitle className="text-lg">Главная цель</CardTitle>
          <p className="text-base font-semibold mt-1">{progress.primaryGoal}</p>
          {activeGoal && (
            <p className="text-sm text-muted mt-2">
              Сейчас в работе: <span className="text-foreground">{activeGoal}</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Прогресс</span>
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
              <dt className="text-muted">Дополнительный доход найден</dt>
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
      </CardHeader>
    </Card>
  );
}
