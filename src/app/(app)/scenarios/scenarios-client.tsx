"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { parseNumberForCalc } from "@/lib/forms/numeric-field";
import { Badge } from "@/components/ui/badge";
import {
  PRESET_SCENARIOS,
  runScenario,
  type ScenarioInput,
} from "@/lib/finance/scenarios";
import { formatCurrency } from "@/lib/utils";
import type { Debt, Expense, Income, ScenarioResult } from "@/types/database";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";
import { useMemo, useState } from "react";
import { COPY } from "@/lib/copy/ui";
import { getIndexLabel } from "@/lib/finance/index";

export function ScenariosPageClient({
  incomes,
  expenses,
  debts,
  profileType,
  profileIncome,
}: {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  profileType: ProfileType;
  profileIncome: ProfileIncomeParameters;
}) {
  const [custom, setCustom] = useState({
    name: "Свой сценарий",
    incomeChangePercent: "",
    expenseChangePercent: "",
    extraDebtPayment: "",
    removeNonEssential: false,
  });

  const presetResults = useMemo(
    () =>
      PRESET_SCENARIOS.map((s) =>
        runScenario(incomes, expenses, debts, s, profileType, profileIncome)
      ),
    [incomes, expenses, debts, profileType, profileIncome]
  );

  const customScenarioInput: ScenarioInput = useMemo(
    () => ({
      name: custom.name,
      incomeChangePercent: parseNumberForCalc(custom.incomeChangePercent),
      expenseChangePercent: parseNumberForCalc(custom.expenseChangePercent),
      extraDebtPayment: parseNumberForCalc(custom.extraDebtPayment),
      removeNonEssential: custom.removeNonEssential,
    }),
    [custom]
  );

  const customResult = useMemo(
    () =>
      runScenario(
        incomes,
        expenses,
        debts,
        customScenarioInput,
        profileType,
        profileIncome
      ),
    [incomes, expenses, debts, customScenarioInput, profileType, profileIncome]
  );

  return (
    <div>
      <PageHeader
        title="Что будет, если..."
        description="Посмотрите, как изменятся ваши деньги в разных ситуациях"
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
          <NumericInput
            id="s-income"
            label="Изменение дохода (%)"
            mode="decimal"
            value={custom.incomeChangePercent}
            onValueChange={(value) =>
              setCustom({ ...custom, incomeChangePercent: value })
            }
            placeholder="0"
          />
          <NumericInput
            id="s-expense"
            label="Изменение расходов (%)"
            mode="decimal"
            value={custom.expenseChangePercent}
            onValueChange={(value) =>
              setCustom({ ...custom, expenseChangePercent: value })
            }
            placeholder="0"
          />
          <NumericInput
            id="s-extra"
            label="Доп. платёж по долгам (₽)"
            mode="decimal"
            value={custom.extraDebtPayment}
            onValueChange={(value) =>
              setCustom({ ...custom, extraDebtPayment: value })
            }
            placeholder="5000"
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
          <span className="text-muted">{COPY.moneyScore}</span>
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
