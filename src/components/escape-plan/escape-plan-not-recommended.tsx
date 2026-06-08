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
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Не рекомендуем</h2>
      <ul className="space-y-3 text-sm">
        {items.map((item) => {
          const whyNot = item.why_not ?? item.reason;
          return (
            <li key={item.title} className="flex gap-2">
              <X className="size-4 shrink-0 text-muted mt-0.5" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted mt-0.5">Причина: {whyNot}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
