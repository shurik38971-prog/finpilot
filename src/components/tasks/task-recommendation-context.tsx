import {
  getImportanceMessage,
  hasQuantifiableFinancialEffect,
} from "@/lib/finance/task-effect-eligibility";
import { cn } from "@/lib/utils";

interface TaskRecommendationContextProps {
  title: string;
  description?: string | null;
  explanation?: string | null;
  taskCategory?: string | null;
  className?: string;
  compact?: boolean;
}

export function TaskRecommendationContext({
  title,
  description,
  explanation,
  taskCategory,
  className,
  compact = false,
}: TaskRecommendationContextProps) {
  const quantifiable = hasQuantifiableFinancialEffect(
    title,
    description,
    taskCategory
  );

  if (quantifiable) {
    if (!explanation) return null;
    return (
      <div
        className={cn(
          compact ? "text-xs" : "rounded-lg border border-border/60 bg-surface-hover/20 p-3",
          className
        )}
      >
        <p className={cn("text-muted", compact ? "inline" : "text-[11px] uppercase tracking-wide")}>
          {compact ? "Основание: " : "Основание"}
        </p>
        {!compact && <p className="text-sm mt-1">{explanation}</p>}
        {compact && (
          <span className="text-foreground font-medium">{explanation}</span>
        )}
      </div>
    );
  }

  const importance = getImportanceMessage(title, description);

  return (
    <div
      className={cn(
        compact ? "text-xs space-y-0.5" : "rounded-lg border border-border/60 bg-surface-hover/20 p-3 space-y-2",
        className
      )}
    >
      <p className={cn("font-medium text-foreground", compact ? "text-[11px]" : "text-xs")}>
        Почему это важно
      </p>
      <p className={cn("text-muted leading-relaxed", compact ? "text-xs" : "text-sm")}>
        {importance}
      </p>
      {explanation && (
        <p className={cn("text-muted", compact ? "text-[11px]" : "text-xs")}>
          <span className="text-muted">Основание: </span>
          <span className="text-foreground">{explanation}</span>
        </p>
      )}
    </div>
  );
}
