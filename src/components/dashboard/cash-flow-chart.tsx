"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashFlowForecast } from "@/types/database";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { COPY, HINTS } from "@/lib/copy/ui";
import { FORECAST_INSUFFICIENT_MESSAGE } from "@/lib/finance/forecast-profile-income";
import type { ForecastScenario } from "@/lib/finance/forecast-profile-income";
import { formatCurrency } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface CashFlowChartProps {
  data: CashFlowForecast[];
  insufficientData?: boolean;
  basisLabel?: string | null;
  scenarios?: ForecastScenario[];
  interpretation?: string | null;
}

export function CashFlowChart({
  data,
  insufficientData = false,
  basisLabel = null,
  scenarios = [],
  interpretation = null,
}: CashFlowChartProps) {
  const hasRange = data.some(
    (point) => point.incomeMin !== undefined && point.incomeMax !== undefined
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5">
          Прогноз на 3 месяца
        </CardTitle>
        <CardDescription className="flex flex-col gap-1.5">
          <span className="inline-flex flex-wrap items-center gap-1">
            {COPY.safetyBuffer}
            <HintTooltip hint={HINTS.safetyBuffer} />
            <span className="text-muted/70">·</span>
            <span>
              {insufficientData
                ? FORECAST_INSUFFICIENT_MESSAGE
                : "Сколько останется каждый месяц"}
            </span>
          </span>
          {!insufficientData && basisLabel && (
            <span className="text-xs text-muted leading-relaxed">
              {basisLabel}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      {!insufficientData && scenarios.length > 0 && (
        <div className="mx-5 mb-3 flex flex-wrap gap-2 text-xs">
          {scenarios.map((scenario) => (
            <span
              key={scenario.label}
              className="rounded-lg border border-border/60 bg-surface-hover/40 px-2.5 py-1 text-muted"
            >
              {scenario.label}: {formatCurrency(scenario.monthlyIncome)}/мес
            </span>
          ))}
        </div>
      )}

      {interpretation && !insufficientData && (
        <div className="mx-5 mb-4 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 to-accent/5 px-4 py-3.5">
          <p className="text-[11px] uppercase tracking-wide text-accent font-medium flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Что это значит для вас
          </p>
          <p className="text-sm sm:text-base font-medium leading-snug text-foreground">
            {interpretation}
          </p>
        </div>
      )}

      <div className="h-72 flex-1 min-h-[288px]">
        {insufficientData ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
            {FORECAST_INSUFFICIENT_MESSAGE}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#141416",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              {hasRange && (
                <>
                  <Line
                    type="monotone"
                    dataKey="incomeMin"
                    name="Доход (мин.)"
                    stroke="#86efac"
                    strokeDasharray="4 4"
                    dot={false}
                    strokeWidth={1.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="incomeMax"
                    name="Доход (макс.)"
                    stroke="#16a34a"
                    strokeDasharray="4 4"
                    dot={false}
                    strokeWidth={1.5}
                  />
                </>
              )}
              <Area
                type="monotone"
                dataKey="income"
                name={hasRange ? "Доход (базовый)" : "Доход"}
                stroke="#22c55e"
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Расходы"
                stroke="#ef4444"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="net"
                name={COPY.leftPerMonth}
                stroke="#3b82f6"
                fill="url(#netGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
