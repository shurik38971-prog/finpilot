"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEscapeFitLabel,
  type EscapeFitLevel,
} from "@/lib/escape-plan/rank-options";
import { formatEscapeIncomeRange, type EscapePlanOption } from "@/types/escape-plan";
import { Check, Loader2 } from "lucide-react";

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

function resolveWhyChosen(option: EscapePlanOption): string[] {
  if (option.why_chosen?.length) return option.why_chosen;
  if (option.why_fits) return [option.why_fits];
  return [];
}

interface EscapePlanOptionCardProps {
  option: EscapePlanOption;
  fitIndex: number;
  fitTotal: number;
  isActive: boolean;
  choosing: boolean;
  onChoose: (option: EscapePlanOption) => void;
}

export function EscapePlanOptionCard({
  option,
  fitIndex,
  fitTotal,
  isActive,
  choosing,
  onChoose,
}: EscapePlanOptionCardProps) {
  const { level, label: fitLabel } = getEscapeFitLabel(option, fitIndex, fitTotal);
  const incomeRange = formatEscapeIncomeRange(option);
  const whyChosen = resolveWhyChosen(option);

  return (
    <Card className={isActive ? "ring-1 ring-accent/50" : undefined}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{option.title}</CardTitle>
          <Badge variant={fitVariant(level)}>{fitLabel}</Badge>
        </div>

        {option.why_fits && <CardDescription>{option.why_fits}</CardDescription>}

        {whyChosen.length > 0 && (
          <div className="text-sm">
            <p className="text-muted mb-2">Почему этот вариант подходит:</p>
            <ul className="space-y-1">
              {whyChosen.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted">Первый шаг</dt>
            <dd>{option.first_step || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Потенциал</dt>
            <dd className="font-medium">
              {incomeRange ?? "зависит от исполнения и рынка"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Время</dt>
            <dd>{option.time_required || "—"}</dd>
          </div>
        </dl>

        {isActive ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Check className="size-4" />
            Вы выбрали это направление
          </div>
        ) : (
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
        )}
      </CardHeader>
    </Card>
  );
}
