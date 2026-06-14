"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ESCAPE_HOURS_OPTIONS,
  getEffectiveConstraints,
  getEffectiveSkills,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type UserCapabilities,
} from "@/types/escape-plan";
import { Check } from "lucide-react";

function hoursLabel(hours: number | null | undefined): string {
  if (!hours) return "не указано";
  const match = ESCAPE_HOURS_OPTIONS.find((o) => o.value === hours);
  return match?.label ?? `${hours} ч/нед`;
}

interface CapabilitiesProfileSummaryProps {
  capabilities: UserCapabilities;
  onEdit: () => void;
}

function CheckList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">не указано</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm">
          <Check className="size-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CapabilitiesProfileSummary({
  capabilities,
  onEdit,
}: CapabilitiesProfileSummaryProps) {
  const primaryGoal = resolvePrimaryGoal(capabilities);
  const secondaryGoals = resolveSecondaryGoals(capabilities);
  const goals = [primaryGoal, ...secondaryGoals];

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">Ваши навыки и возможности</CardTitle>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Изменить
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted mb-2">Навыки</p>
            <CheckList items={getEffectiveSkills(capabilities)} />
          </div>
          <div>
            <p className="text-muted mb-2">Цели</p>
            <CheckList items={goals} />
          </div>
          <div>
            <p className="text-muted mb-2">Ограничения</p>
            <CheckList items={getEffectiveConstraints(capabilities)} />
          </div>
          <div>
            <p className="text-muted mb-1">Время</p>
            <p className="font-medium">
              {hoursLabel(capabilities.available_hours_per_week)}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
