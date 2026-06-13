"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactRisk,
  compactWhyReasons,
  getTop3FitLabel,
} from "@/lib/escape-plan/option-display";
import { cn } from "@/lib/utils";
import type { EscapeFitLevel } from "@/lib/escape-plan/rank-options";
import { formatEscapeIncomeRange, type EscapePlanOption } from "@/types/escape-plan";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

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
}

export function EscapePlanOptionCard({
  option,
  fitIndex,
  fitLevel,
  choosing,
  onChoose,
}: EscapePlanOptionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const level = fitLevel ?? (fitIndex <= 1 ? "excellent" : fitIndex === 2 ? "good" : "low");
  const fitLabel = fitIndex <= 2 ? getTop3FitLabel(fitIndex) : "Запасной вариант";
  const tryLabel = useCopy("btn.try_option");
  const creatingLabel = useCopy("btn.creating_plan");
  const incomeRange = formatEscapeIncomeRange(option);
  const whyReasons = compactWhyReasons(option, 4);

  return (
    <Card className="!p-0 overflow-hidden">
      <CardHeader className="space-y-2.5 p-3.5 sm:space-y-3 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{option.title}</CardTitle>
          <Badge variant={fitVariant(level)} className="shrink-0">
            {fitLabel}
          </Badge>
        </div>

        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted">Потенциал: </span>
            <span className="font-medium">
              {incomeRange ?? "зависит от рынка"}
            </span>
          </p>
          <p className="line-clamp-2 sm:line-clamp-none">
            <span className="text-muted">Первый шаг: </span>
            {option.first_step || "—"}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted sm:hidden -ml-2"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Свернуть" : "Подробнее"}
          <ChevronDown
            className={cn("size-3.5 ml-1 transition-transform", expanded && "rotate-180")}
          />
        </Button>

        <div className={cn("space-y-3", !expanded && "hidden sm:block")}>
          {whyReasons.length > 0 && (
            <ul className="text-sm space-y-1 text-foreground/85">
              {whyReasons.map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          )}

          <p className="text-sm">
            <span className="text-muted">Риск: </span>
            {compactRisk(option, 80)}
          </p>

          <Button
            variant="secondary"
            size="sm"
            disabled={choosing}
            onClick={() => onChoose(option)}
            className="w-full sm:w-fit"
          >
            {choosing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {creatingLabel}
              </>
            ) : (
              tryLabel
            )}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
