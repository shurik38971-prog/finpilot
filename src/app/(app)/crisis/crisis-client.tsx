"use client";

import { DebtPayoffBreakdown } from "@/components/crisis/debt-payoff-breakdown";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateDebtPayoff } from "@/lib/finance/debt-strategies";
import type { Debt } from "@/types/database";
import { useMemo, useState } from "react";

export function CrisisPageClient({ debts }: { debts: Debt[] }) {
  const [extraPayment, setExtraPayment] = useState(5000);

  const avalanche = useMemo(
    () => calculateDebtPayoff(debts, extraPayment, "avalanche"),
    [debts, extraPayment]
  );

  const snowball = useMemo(
    () => calculateDebtPayoff(debts, extraPayment, "snowball"),
    [debts, extraPayment]
  );

  return (
    <div>
      <PageHeader
        title="Антикризисный режим"
        description="Стратегии погашения долгов с прозрачным расчётом"
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
      ) : (
        <DebtPayoffBreakdown avalanche={avalanche} snowball={snowball} />
      )}
    </div>
  );
}
