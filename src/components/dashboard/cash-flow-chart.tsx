"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashFlowForecast } from "@/types/database";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { COPY, HINTS } from "@/lib/copy/ui";
import { formatCurrency } from "@/lib/utils";

interface CashFlowChartProps {
  data: CashFlowForecast[];
  insufficientData?: boolean;
  interpretation?: string | null;
}

export function CashFlowChart({
  data,
  insufficientData = false,
  interpretation = null,
}: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Прогноз на 3 месяца
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center gap-1">
            {COPY.safetyBuffer}
            <HintTooltip hint={HINTS.safetyBuffer} />
          </span>
          <span className="text-muted/70">·</span>
          <span>
            {insufficientData
              ? "Недостаточно данных для прогноза"
              : "Сколько останется каждый месяц"}
          </span>
        </CardDescription>
      </CardHeader>
      {interpretation && !insufficientData && (
        <div className="mx-5 mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-foreground">
          {interpretation}
        </div>
      )}
      <div className="h-72">
        {insufficientData ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
            Недостаточно данных для прогноза. Добавьте фактические поступления или
            ожидаемый доход.
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
            <Area
              type="monotone"
              dataKey="income"
              name="Доход"
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
