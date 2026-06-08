"use client";

import { DebtPayoffBreakdown } from "@/components/crisis/debt-payoff-breakdown";
import { SingleDebtForecast } from "@/components/crisis/single-debt-forecast";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateDebtPayoff } from "@/lib/finance/debt-strategies";
import type { Debt } from "@/types/database";
import { useMemo, useState } from "react";

export function CrisisPageClient({ debts }: { debts: Debt[] }) {
  const [extraPayment, setExtraPayment] = useState(5000);
  const multipleDebts = debts.length >= 2;

  const singlePlan = useMemo(
    () =>
      debts.length === 1
        ? calculateDebtPayoff(debts, extraPayment, "avalanche")
        : null,
    [debts, extraPayment]
  );

  const avalanche = useMemo(
    () =>
      multipleDebts
        ? calculateDebtPayoff(debts, extraPayment, "avalanche")
        : null,
    [debts, extraPayment, multipleDebts]
  );

  const snowball = useMemo(
    () =>
      multipleDebts
        ? calculateDebtPayoff(debts, extraPayment, "snowball")
        : null,
    [debts, extraPayment, multipleDebts]
  );

  return (
    <div>
      <PageHeader
        title="Антикризисный режим"
        description={
          multipleDebts
            ? "Стратегии погашения долгов с прозрачным расчётом"
            : "Прогноз погашения долга с учётом дополнительных платежей"
        }
      />

      <div className="mb-6 max-w-xs">
        <Input
          id="extra"
          label="Дополнительный платёж в месяц (₽)"
          type="number"
          min="0"
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
        />
      </div>

      {debts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет долгов</CardTitle>
            <CardDescription>
              Добавьте долги на странице «Долги», чтобы увидеть план погашения
            </CardDescription>
          </CardHeader>
        </Card>
      ) : debts.length === 1 && singlePlan ? (
        <SingleDebtForecast
          debt={debts[0]}
          plan={singlePlan}
          extraPayment={extraPayment}
        />
      ) : avalanche && snowball ? (
        <DebtPayoffBreakdown avalanche={avalanche} snowball={snowball} />
      ) : null}
    </div>
  );
}
