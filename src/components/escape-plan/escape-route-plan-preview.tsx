"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { cn } from "@/lib/utils";
import { splitRouteStepsForPreview } from "@/lib/escape-plan/route-steps";
import type { FinancialTask } from "@/types/tasks";

interface EscapeRoutePlanPreviewProps {
  steps: FinancialTask[];
}

export function EscapeRoutePlanPreview({ steps }: EscapeRoutePlanPreviewProps) {
  const actionPlanLabel = useCopy("escape.action_plan");
  const { lastDone, nextStep, upcoming } = splitRouteStepsForPreview(steps);

  if (!lastDone && !nextStep && upcoming.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{actionPlanLabel}</p>
      <ul className="space-y-2 text-sm">
        {lastDone && (
          <li className="rounded-lg border border-border/40 bg-surface/30 p-3 text-muted line-through">
            <span className="text-xs uppercase tracking-wide block mb-1">
              Последний выполненный
            </span>
            {lastDone.title}
          </li>
        )}
        {nextStep && (
          <li className="rounded-lg border border-accent/40 bg-accent/10 p-3">
            <span className="text-xs uppercase tracking-wide text-accent block mb-1">
              Следующий шаг
            </span>
            <span className="font-medium">{nextStep.title}</span>
            {nextStep.description && (
              <p className="text-muted mt-1 text-xs leading-relaxed">
                {nextStep.description}
              </p>
            )}
          </li>
        )}
        {upcoming.map((step) => (
          <li
            key={step.id}
            className={cn(
              "rounded-lg border border-border/50 bg-surface/50 p-3 text-foreground/85"
            )}
          >
            <span className="text-xs text-muted block mb-1">Далее по маршруту</span>
            {step.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
