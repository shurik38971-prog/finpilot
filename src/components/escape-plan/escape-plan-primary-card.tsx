"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactRisk,
  compactWhyReasons,
  getTop3FitLabel,
} from "@/lib/escape-plan/option-display";
import { formatEscapeIncomeRange, type EscapePlanOption } from "@/types/escape-plan";
import { Check, Loader2 } from "lucide-react";

interface EscapePlanPrimaryCardProps {
  option: EscapePlanOption;
  choosing: boolean;
  onChoose: (option: EscapePlanOption) => void;
}

export function EscapePlanPrimaryCard({
  option,
  choosing,
  onChoose,
}: EscapePlanPrimaryCardProps) {
  const incomeRange = formatEscapeIncomeRange(option);
  const whyReasons = compactWhyReasons(option, 4);

  return (
    <Card className="border-accent/50 bg-accent/5 ring-1 ring-accent/30">
      <CardHeader className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Главная рекомендация · {getTop3FitLabel(0)}
        </p>
        <CardTitle className="text-xl">{option.title}</CardTitle>

        <div className="text-sm">
          <p className="text-muted">Потенциал</p>
          <p className="font-semibold text-lg mt-0.5">
            {incomeRange ?? "зависит от исполнения"}
          </p>
        </div>

        {whyReasons.length > 0 && (
          <div className="text-sm">
            <p className="text-muted mb-2">Почему именно это</p>
            <ul className="space-y-1">
              {whyReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Первый шаг</dt>
            <dd>{option.first_step || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Риск</dt>
            <dd>{compactRisk(option)}</dd>
          </div>
        </dl>

        <Button
          size="lg"
          disabled={choosing}
          onClick={() => onChoose(option)}
          className="w-full sm:w-fit"
        >
          {choosing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Создаём план…
            </>
          ) : (
            "Начать этот план"
          )}
        </Button>
      </CardHeader>
    </Card>
  );
}
