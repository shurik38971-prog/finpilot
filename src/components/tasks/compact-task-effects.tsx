import { formatCurrency } from "@/lib/utils";
import type { TaskImpact } from "@/types/task-impact";
import { cn } from "@/lib/utils";

interface CompactTaskEffectsProps {
  impact: TaskImpact;
  className?: string;
}

export function CompactTaskEffects({ impact, className }: CompactTaskEffectsProps) {
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

  const items: { key: string; label: string; className?: string }[] = [];

  if (indexDelta !== null && indexDelta !== 0) {
    items.push({
      key: "index",
      label: `${indexDelta > 0 ? "+" : ""}${indexDelta} к здоровью`,
      className: indexDelta > 0 ? "text-emerald-400" : "text-muted",
    });
  }

  if (cashflowDelta !== 0) {
    items.push({
      key: "cashflow",
      label: `${cashflowDelta > 0 ? "+" : ""}${formatCurrency(cashflowDelta)}/мес`,
      className: cashflowDelta > 0 ? "text-emerald-400" : "text-muted",
    });
  }

  if (goalMonthsDelta !== null && goalMonthsDelta > 0) {
    items.push({
      key: "goal",
      label: `−${goalMonthsDelta} мес до цели`,
      className: "text-emerald-400",
    });
  }

  if (items.length === 0) return null;

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
