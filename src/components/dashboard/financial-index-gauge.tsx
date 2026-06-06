"use client";

import { HintTooltip } from "@/components/ui/hint-tooltip";
import { COPY, HINTS } from "@/lib/copy/ui";
import { getIndexLabel } from "@/lib/finance/index";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialIndexGaugeProps {
  index: number | null;
}

export function FinancialIndexGauge({ index }: FinancialIndexGaugeProps) {
  if (index === null) {
    return (
      <Card className="flex h-full flex-col items-center !p-4">
        <CardHeader className="text-center w-full mb-2">
          <CardTitle className="text-base flex items-center justify-center gap-1">
            {COPY.moneyScore}
            <HintTooltip hint={HINTS.financialHealth} />
          </CardTitle>
          <CardDescription className="text-xs">{COPY.moneyScoreHint}</CardDescription>
        </CardHeader>
        <div className="flex flex-1 items-center justify-center py-8 px-4 text-center">
          <p className="text-sm text-muted">Недостаточно данных для расчёта</p>
        </div>
      </Card>
    );
  }

  const { label, color } = getIndexLabel(index);
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (index / 100) * circumference;

  return (
    <Card className="flex h-full flex-col items-center justify-center !p-4">
      <CardHeader className="text-center w-full mb-2">
        <CardTitle className="text-base flex items-center justify-center gap-1">
          {COPY.moneyScore}
          <HintTooltip hint={HINTS.financialHealth} />
        </CardTitle>
        <CardDescription className="text-xs">{COPY.moneyScoreHint}</CardDescription>
      </CardHeader>
      <div className="relative my-2">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            className="text-surface-hover"
          />
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{index}</span>
          <span className="text-xs text-muted">{label}</span>
        </div>
      </div>
    </Card>
  );
}
