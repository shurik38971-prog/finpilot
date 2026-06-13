import { getImportanceMessage } from "@/lib/finance/task-effect-eligibility";
import { cn } from "@/lib/utils";

interface TaskRecommendationContextProps {
  title: string;
  description?: string | null;
  explanation?: string | null;
  className?: string;
  compact?: boolean;
}

export function TaskRecommendationContext({
  title,
  description,
  explanation,
  className,
  compact = false,
}: TaskRecommendationContextProps) {
  const whyImportant =
    explanation?.trim() || getImportanceMessage(title, description);

  if (!whyImportant) return null;

  return (
    <div
      className={cn(
        compact
          ? "text-xs"
          : "rounded-lg border border-border/60 bg-surface-hover/20 p-3",
        className
      )}
    >
      <p
        className={cn(
          "text-muted",
          compact ? "inline" : "text-[11px] uppercase tracking-wide"
        )}
      >
        {compact ? "Почему это важно: " : "Почему это важно"}
      </p>
      {!compact && (
        <p className="text-sm mt-1 text-foreground leading-relaxed">
          {whyImportant}
        </p>
      )}
      {compact && (
        <span className="text-foreground leading-relaxed">{whyImportant}</span>
      )}
    </div>
  );
}
