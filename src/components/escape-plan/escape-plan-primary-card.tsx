"use client";

import { useCopy } from "@/components/copy/site-copy-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactRisk,
  compactWhyReasons,
  getTop3FitLabel,
} from "@/lib/escape-plan/option-display";
import { cn } from "@/lib/utils";
import { formatEscapeIncomeRange, type EscapePlanOption } from "@/types/escape-plan";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface EscapePlanPrimaryCardProps {
  option: EscapePlanOption;
  choosing: boolean;
  onChoose: (option: EscapePlanOption) => void;
  actionLabel?: string;
}

export function EscapePlanPrimaryCard({
  option,
  choosing,
  onChoose,
  actionLabel,
}: EscapePlanPrimaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const incomeRange = formatEscapeIncomeRange(option);
  const whyReasons = compactWhyReasons(option, 4);
  const primaryLabel = useCopy("escape.primary_recommendation");
  const defaultStartLabel = useCopy("btn.start_direction");
  const tryLabel = actionLabel ?? defaultStartLabel;
  const creatingLabel = useCopy("btn.creating_plan");

  return (
    <Card className="border-accent/50 bg-accent/5 ring-1 ring-accent/30 !p-0 overflow-hidden">
      <CardHeader className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          {primaryLabel} · {getTop3FitLabel(0)}
        </p>
        <CardTitle className="text-lg leading-snug sm:text-xl">{option.title}</CardTitle>

        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted">Потенциал: </span>
            <span className="font-semibold">
              {incomeRange ?? "зависит от исполнения"}
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
          className="h-8 px-2 text-xs text-accent sm:hidden -ml-2"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Свернуть" : "Подробнее"}
          <ChevronDown
            className={cn("size-3.5 ml-1 transition-transform", expanded && "rotate-180")}
          />
        </Button>

        <div className={cn("space-y-3", !expanded && "hidden sm:block")}>
          {whyReasons.length > 0 && (
            <div className="text-sm">
              <p className="text-muted mb-1.5">Почему именно это</p>
              <ul className="space-y-1">
                {whyReasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="text-foreground/90">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm">
            <span className="text-muted">Риск: </span>
            {compactRisk(option)}
          </p>

          <Button
            size="lg"
            disabled={choosing}
            onClick={() => onChoose(option)}
            className={cn("w-full sm:w-fit", !expanded && "hidden sm:inline-flex")}
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
