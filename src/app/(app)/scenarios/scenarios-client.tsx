"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PRESET_SCENARIOS,
  runScenario,
  type ScenarioInput,
} from "@/lib/finance/scenarios";
import { formatCurrency } from "@/lib/utils";
import type { Debt, Expense, Income, ScenarioResult } from "@/types/database";
import { useMemo, useState } from "react";
import { getIndexLabel } from "@/lib/finance/index";

export function ScenariosPageClient({
  incomes,
  expenses,
  debts,
}: {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
}) {
  const [custom, setCustom] = useState<ScenarioInput>({
    name: "Свой сценарий",
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    extraDebtPayment: 0,
    removeNonEssential: false,
  });

  const presetResults = useMemo(
    () =>
      PRESET_SCENARIOS.map((s) =>
        runScenario(incomes, expenses, debts, s)
      ),
    [incomes, expenses, debts]
  );

  const customResult = useMemo(
    () => runScenario(incomes, expenses, debts, custom),
    [incomes, expenses, debts, custom]
  );

  return (
    <div>
      <PageHeader
        title="Что будет, если..."
        description="Моделирование финансовых сценариев"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {presetResults.map((result) => (
          <ScenarioCard key={result.name} result={result} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Свой сценарий</CardTitle>
          <CardDescription>Настройте параметры вручную</CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Input
            id="s-name"
            label="Название"
            value={custom.name}
            onChange={(e) => setCustom({ ...custom, name: e.target.value })}
          />
          <Input
            id="s-income"
            label="Изменение дохода (%)"
            type="number"
            value={custom.incomeChangePercent}
            onChange={(e) =>
              setCustom({
                ...custom,
                incomeChangePercent: Number(e.target.value),
              })
            }
          />
          <Input
            id="s-expense"
            label="Изменение расходов (%)"
            type="number"
            value={custom.expenseChangePercent}
            onChange={(e) =>
              setCustom({
                ...custom,
                expenseChangePercent: Number(e.target.value),
              })
            }
          />
          <Input
            id="s-extra"
            label="Доп. платёж по долгам (₽)"
            type="number"
            min="0"
            value={custom.extraDebtPayment}
            onChange={(e) =>
              setCustom({
                ...custom,
                extraDebtPayment: Number(e.target.value),
              })
            }
          />
        </div>

        <label className="flex items-center gap-2 text-sm mb-6">
          <input
            type="checkbox"
            checked={custom.removeNonEssential}
            onChange={(e) =>
              setCustom({ ...custom, removeNonEssential: e.target.checked })
            }
            className="rounded border-border"
          />
          Убрать все необязательные расходы
        </label>

        <ScenarioCard result={customResult} />
      </Card>
    </div>
  );
}

function ScenarioCard({ result }: { result: ScenarioResult }) {
  const indexLabel =
    result.financialIndex === null
      ? { label: "Недостаточно данных", color: "text-muted" }
      : getIndexLabel(result.financialIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{result.name}</CardTitle>
      </CardHeader>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Доход / мес</span>
          <span>{formatCurrency(result.monthlyIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Расходы / мес</span>
          <span>{formatCurrency(result.monthlyExpenses)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Долги закрыты за</span>
          <span>{result.monthsToDebtFree} мес.</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Баланс за 3 мес.</span>
          <span
            className={
              result.threeMonthBalance >= 0 ? "text-emerald-400" : "text-red-400"
            }
          >
            {formatCurrency(result.threeMonthBalance)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-muted">Фин. индекс</span>
          <Badge className={indexLabel.color}>
            {result.financialIndex === null
              ? indexLabel.label
              : `${result.financialIndex} — ${indexLabel.label}`}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
