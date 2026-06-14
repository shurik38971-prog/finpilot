"use client";

import { Badge } from "@/components/ui/badge";
import type { DebtPriorityAssessment } from "@/lib/finance/debt-priority";
import { cn } from "@/lib/utils";

function levelVariant(
  level: DebtPriorityAssessment["level"]
): "danger" | "warning" | "default" {
  switch (level) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    default:
      return "default";
  }
}

interface DebtPriorityInsightProps {
  assessment: DebtPriorityAssessment;
  className?: string;
}

export function DebtPriorityInsight({
  assessment,
  className,
}: DebtPriorityInsightProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-surface-hover/20 p-3 space-y-2",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Приоритет погашения</span>
        <Badge variant={levelVariant(assessment.level)}>{assessment.label}</Badge>
      </div>
      <p className="text-xs text-foreground/80 leading-relaxed">
        {assessment.explanation}
      </p>
      <p className="text-[11px] text-muted leading-relaxed">
        Рассчитывается автоматически по ставке, платежу, типу долга и просрочке.
      </p>
    </div>
  );
}
