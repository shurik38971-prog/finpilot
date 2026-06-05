"use client";

import { getIndexLabel } from "@/lib/finance/index";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialIndexGaugeProps {
  index: number | null;
}

export function FinancialIndexGauge({ index }: FinancialIndexGaugeProps) {
  if (index === null) {
    return (
      <Card className="flex flex-col items-center">
        <CardHeader className="text-center w-full">
          <CardTitle>Финансовый индекс</CardTitle>
          <CardDescription>Здоровье ваших финансов от 0 до 100</CardDescription>
        </CardHeader>
        <div className="flex flex-1 items-center justify-center py-12 px-4 text-center">
          <p className="text-sm text-muted">Недостаточно данных для расчёта</p>
        </div>
      </Card>
    );
  }

  const { label, color } = getIndexLabel(index);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (index / 100) * circumference;

  return (
    <Card className="flex flex-col items-center">
      <CardHeader className="text-center w-full">
        <CardTitle>Финансовый индекс</CardTitle>
        <CardDescription>Здоровье ваших финансов от 0 до 100</CardDescription>
      </CardHeader>
      <div className="relative my-4">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface-hover"
          />
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{index}</span>
          <span className="text-xs text-muted">{label}</span>
        </div>
      </div>
    </Card>
  );
}
