import type { EscapePlanNotRecommended } from "@/types/escape-plan";
import { X } from "lucide-react";

interface EscapePlanNotRecommendedListProps {
  items: EscapePlanNotRecommended[];
}

export function EscapePlanNotRecommendedList({
  items,
}: EscapePlanNotRecommendedListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold sm:text-lg">Не рекомендуем</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => {
          const whyNot = item.why_not ?? item.reason;
          return (
            <li
              key={item.title}
              className="flex gap-2 rounded-lg border border-border/60 bg-surface-hover/30 px-3 py-2"
            >
              <X className="size-4 shrink-0 text-muted mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium leading-snug">{item.title}</p>
                <p className="text-foreground/80 mt-0.5 text-xs leading-relaxed sm:text-sm">
                  {whyNot}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
