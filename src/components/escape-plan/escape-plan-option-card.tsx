"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactRisk,
  compactWhyReasons,
  getTop3FitLabel,
} from "@/lib/escape-plan/option-display";
import type { EscapeFitLevel } from "@/lib/escape-plan/rank-options";
import { formatEscapeIncomeRange, type EscapePlanOption } from "@/types/escape-plan";
import { Loader2 } from "lucide-react";

function fitVariant(level: EscapeFitLevel): "success" | "warning" | "default" {
  switch (level) {
    case "excellent":
      return "success";
    case "good":
      return "warning";
    default:
      return "default";
  }
}

interface EscapePlanOptionCardProps {
  option: EscapePlanOption;
  fitIndex: number;
  fitLevel?: EscapeFitLevel;
  choosing: boolean;
  onChoose: (option: EscapePlanOption) => void;
  compact?: boolean;
}

export function EscapePlanOptionCard({
  option,
  fitIndex,
  fitLevel,
  choosing,
  onChoose,
  compact = true,
}: EscapePlanOptionCardProps) {
  const level = fitLevel ?? (fitIndex <= 1 ? "excellent" : fitIndex === 2 ? "good" : "low");
  const fitLabel = fitIndex <= 2 ? getTop3FitLabel(fitIndex) : "Запасной вариант";
  const incomeRange = formatEscapeIncomeRange(option);
  const whyReasons = compactWhyReasons(option, compact ? 2 : 4);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{option.title}</CardTitle>
          <Badge variant={fitVariant(level)}>{fitLabel}</Badge>
        </div>

        {whyReasons.length > 0 && (
          <ul className="text-sm space-y-1 text-muted">
            {whyReasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        )}

        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted">Первый шаг</dt>
            <dd>{option.first_step || "—"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <dt className="text-muted inline">Потенциал: </dt>
              <dd className="inline font-medium">
                {incomeRange ?? "зависит от рынка"}
              </dd>
            </div>
            <div>
              <dt className="text-muted inline">Риск: </dt>
              <dd className="inline">{compactRisk(option, 80)}</dd>
            </div>
          </div>
        </dl>

        <Button
          variant="secondary"
          size="sm"
          disabled={choosing}
          onClick={() => onChoose(option)}
          className="w-fit"
        >
          {choosing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Сохраняем…
            </>
          ) : (
            "Хочу попробовать"
          )}
        </Button>
      </CardHeader>
    </Card>
  );
}
