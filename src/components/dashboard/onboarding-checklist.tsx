"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OnboardingProgress } from "@/types/onboarding";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ListChecks,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface OnboardingChecklistProps {
  progress: OnboardingProgress;
}

const STEPS = [
  {
    field: "profile_done" as const,
    label: "Укажите, кто вы",
    href: "/dashboard",
    cta: "К профилю",
  },
  {
    field: "income_done" as const,
    label: "Добавьте доход",
    href: "/income",
    cta: "К доходам",
  },
  {
    field: "expenses_done" as const,
    label: "Добавьте обязательные платежи",
    href: "/expenses",
    cta: "К расходам",
  },
  {
    field: "debts_done" as const,
    label: "Добавьте долги",
    href: "/debts",
    cta: "К долгам",
  },
  {
    field: "goal_done" as const,
    label: "Создайте финансовую цель",
    href: "/goals",
    cta: "К целям",
  },
  {
    field: "analysis_done" as const,
    label: "Запустите ИИ-анализ",
    href: "/analyze",
    cta: "К анализу",
  },
] as const;

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(progress.completed);
  const doneCount = STEPS.filter((s) => progress[s.field]).length;

  if (progress.completed && collapsed) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Настройка завершена
          </span>
          <ChevronDown className="h-4 w-4 text-muted shrink-0" />
        </button>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-accent" />
              Настройте FinPilot
            </CardTitle>
            <CardDescription className="mt-1">
              Пройдите 6 шагов — займёт около 3–5 минут. После этого вы
              получите главное действие от ИИ.
            </CardDescription>
          </div>
          {progress.completed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-muted hover:text-foreground p-1"
              aria-label="Свернуть"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span>
            {doneCount} из {STEPS.length}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <ul className="px-5 pb-5 space-y-2">
        {STEPS.map((step, index) => {
          const done = progress[step.field];
          const firstIncomplete = STEPS.findIndex((s) => !progress[s.field]);
          const isNext = !done && index === firstIncomplete;

          return (
            <li
              key={step.field}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm",
                done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : isNext
                    ? "border-accent/30 bg-accent/5"
                    : "border-border/60"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted shrink-0" />
                )}
                <span className={done ? "text-muted line-through" : ""}>
                  {step.label}
                </span>
              </span>
              {!done && (
                <Link href={step.href}>
                  <Button size="sm" variant={isNext ? "primary" : "secondary"}>
                    {step.field === "analysis_done" && (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {step.cta}
                  </Button>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
