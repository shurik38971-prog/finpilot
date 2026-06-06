"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COPY } from "@/lib/copy/ui";
import { getIndexLabel } from "@/lib/finance/index";
import {
  buildCurrentFinanceState,
  simulateWhatIf,
  type WhatIfInput,
} from "@/lib/services/impact-simulator";
import { cn, formatCurrency } from "@/lib/utils";
import type { Debt, Expense, Income } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";
import { FlaskConical } from "lucide-react";
import { useMemo, useState } from "react";

interface SimulatorPageClientProps {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  goals: FinancialGoal[];
  profileType: ProfileType;
  profileIncome: ProfileIncomeParameters | null;
}

function DeltaBadge({
  current,
  projected,
  format = "number",
  invert = false,
}: {
  current: number | null;
  projected: number | null;
  format?: "number" | "currency" | "months";
  invert?: boolean;
}) {
  if (current === null || projected === null) {
    return <Badge variant="default">—</Badge>;
  }

  const delta = invert ? current - projected : projected - current;
  if (delta === 0) return <Badge variant="default">без изменений</Badge>;

  const positive = delta > 0;
  const label =
    format === "currency"
      ? `${positive ? "+" : ""}${formatCurrency(delta)}`
      : format === "months"
        ? `${positive ? "+" : ""}${delta} мес`
        : `${positive ? "+" : ""}${delta}`;

  return (
    <Badge variant={positive ? "success" : "danger"}>{label}</Badge>
  );
}

export function SimulatorPageClient({
  incomes,
  expenses,
  debts,
  goals,
  profileType,
  profileIncome,
}: SimulatorPageClientProps) {
  const baseline = useMemo(
    () =>
      buildCurrentFinanceState(
        incomes,
        expenses,
        debts,
        profileType,
        profileIncome
      ),
    [incomes, expenses, debts, profileType, profileIncome]
  );

  const [input, setInput] = useState<WhatIfInput>({
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    debtPaymentChangePercent: 0,
    totalDebtChangePercent: 0,
  });

  const current = useMemo(
    () =>
      simulateWhatIf(
        incomes,
        expenses,
        debts,
        goals,
        {
          incomeChangePercent: 0,
          expenseChangePercent: 0,
          debtPaymentChangePercent: 0,
          totalDebtChangePercent: 0,
        },
        profileType,
        profileIncome
      ),
    [incomes, expenses, debts, goals, profileType, profileIncome]
  );

  const projected = useMemo(
    () =>
      simulateWhatIf(
        incomes,
        expenses,
        debts,
        goals,
        input,
        profileType,
        profileIncome
      ),
    [incomes, expenses, debts, goals, input, profileType, profileIncome]
  );

  const indexMeta =
    projected.financialIndex !== null
      ? getIndexLabel(projected.financialIndex)
      : null;

  return (
    <div>
      <PageHeader
        title="Что будет, если…"
        description="Что будет, если изменить доход, расходы или долги — без сохранения данных"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-accent" />
              Параметры сценария
            </CardTitle>
            <CardDescription>
              Двигайте ползунки — прогноз обновится мгновенно
            </CardDescription>
          </CardHeader>

          <div className="px-5 pb-5 space-y-5">
            <SliderField
              label="Изменение дохода"
              value={input.incomeChangePercent}
              min={-50}
              max={50}
              suffix="%"
              onChange={(v) => setInput({ ...input, incomeChangePercent: v })}
            />
            <SliderField
              label="Изменение расходов"
              value={input.expenseChangePercent}
              min={-50}
              max={30}
              suffix="%"
              onChange={(v) => setInput({ ...input, expenseChangePercent: v })}
            />
            <SliderField
              label="Платежи по долгам"
              value={input.debtPaymentChangePercent}
              min={-40}
              max={20}
              suffix="%"
              onChange={(v) =>
                setInput({ ...input, debtPaymentChangePercent: v })
              }
            />
            <SliderField
              label="Общая сумма долга"
              value={input.totalDebtChangePercent}
              min={-40}
              max={10}
              suffix="%"
              onChange={(v) =>
                setInput({ ...input, totalDebtChangePercent: v })
              }
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Input
                id="sim-income"
                label="Базовый доход (₽/мес)"
                type="number"
                value={baseline.monthlyIncome}
                readOnly
              />
              <Input
                id="sim-expense"
                label="Базовые расходы (₽/мес)"
                type="number"
                value={baseline.monthlyExpenses}
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-base">Прогноз результата</CardTitle>
            <CardDescription>Сравнение с текущим состоянием</CardDescription>
          </CardHeader>

          <div className="px-5 pb-5 space-y-4">
            <ResultRow
              label={COPY.moneyScore}
              current={current.financialIndex}
              projected={projected.financialIndex}
              extra={
                indexMeta && (
                  <span className={cn("text-xs", indexMeta.color)}>
                    {indexMeta.label}
                  </span>
                )
              }
              delta={
                <DeltaBadge
                  current={current.financialIndex}
                  projected={projected.financialIndex}
                />
              }
            />
            <ResultRow
              label={COPY.leftPerMonth}
              current={current.netCashFlow}
              projected={projected.netCashFlow}
              format="currency"
              delta={
                <DeltaBadge
                  current={current.netCashFlow}
                  projected={projected.netCashFlow}
                  format="currency"
                />
              }
            />
            <ResultRow
              label={COPY.debtIncomeShare}
              current={current.debtLoadPercent}
              projected={projected.debtLoadPercent}
              suffix="%"
              invertDelta
              delta={
                <DeltaBadge
                  current={current.debtLoadPercent}
                  projected={projected.debtLoadPercent}
                  invert
                />
              }
            />
            {projected.goalTitle && (
              <ResultRow
                label={`До цели «${projected.goalTitle}»`}
                current={current.goalMonths}
                projected={projected.goalMonths}
                format="months"
                delta={
                  <DeltaBadge
                    current={current.goalMonths}
                    projected={projected.goalMonths}
                    format="months"
                  />
                }
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted">{label}</span>
        <span className={cn(value > 0 && "text-emerald-400", value < 0 && "text-red-400")}>
          {value > 0 ? "+" : ""}
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

function ResultRow({
  label,
  current,
  projected,
  format = "number",
  suffix = "",
  extra,
  delta,
  invertDelta = false,
}: {
  label: string;
  current: number | null;
  projected: number | null;
  format?: "number" | "currency" | "months";
  suffix?: string;
  extra?: React.ReactNode;
  delta?: React.ReactNode;
  invertDelta?: boolean;
}) {
  void invertDelta;

  const fmt = (v: number | null) => {
    if (v === null) return "—";
    if (format === "currency") return formatCurrency(v);
    if (format === "months") return `${v} мес`;
    return `${v}${suffix}`;
  };

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        {delta}
      </div>
      <p className="text-sm">
        {fmt(current)} → <span className="font-medium">{fmt(projected)}</span>
      </p>
      {extra}
    </div>
  );
}
