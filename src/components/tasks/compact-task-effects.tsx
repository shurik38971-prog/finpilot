import { formatCurrency } from "@/lib/utils";
import type { TaskImpact } from "@/types/task-impact";
import { cn } from "@/lib/utils";

export interface TaskEffectItem {
  key: string;
  label: string;
  className?: string;
}

export function getTaskEffectItems(impact: TaskImpact): TaskEffectItem[] {
  const indexDelta =
    impact.current_index !== null && impact.projected_index !== null
      ? impact.projected_index - impact.current_index
      : null;
  const cashflowDelta =
    Number(impact.projected_cashflow) - Number(impact.current_cashflow);
  const goalMonthsDelta =
    impact.current_goal_months !== null &&
    impact.projected_goal_months !== null
      ? impact.current_goal_months - impact.projected_goal_months
      : null;

  const items: TaskEffectItem[] = [];

  if (cashflowDelta !== 0) {
    items.push({
      key: "cashflow",
      label: `${cashflowDelta > 0 ? "+" : ""}${formatCurrency(cashflowDelta)} / мес`,
      className: cashflowDelta > 0 ? "text-emerald-400" : "text-muted",
    });
  }

  if (indexDelta !== null && indexDelta !== 0) {
    items.push({
      key: "index",
      label: `${indexDelta > 0 ? "+" : ""}${indexDelta} к картине`,
      className: indexDelta > 0 ? "text-emerald-400" : "text-muted",
    });
  }

  if (goalMonthsDelta !== null && goalMonthsDelta > 0) {
    items.push({
      key: "goal",
      label: `−${goalMonthsDelta} мес до цели`,
      className: "text-emerald-400",
    });
  }

  return items;
}

interface CompactTaskEffectsProps {
  impact: TaskImpact;
  className?: string;
  variant?: "block" | "inline";
}

export function CompactTaskEffects({
  impact,
  className,
  variant = "block",
}: CompactTaskEffectsProps) {
  const items = getTaskEffectItems(impact);
  if (items.length === 0) return null;

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex flex-wrap gap-x-2 gap-y-0.5", className)}>
        {items.map((item) => (
          <span key={item.key} className={cn("font-medium", item.className)}>
            {item.label}
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] uppercase tracking-wide text-muted">Эффект</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-medium">
        {items.map((item) => (
          <span key={item.key} className={item.className}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
