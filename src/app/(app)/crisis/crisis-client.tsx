"use client";

import { CrisisScenarioComparison } from "@/components/crisis/crisis-scenario-comparison";
import { DebtPayoffBreakdown } from "@/components/crisis/debt-payoff-breakdown";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NumericInput } from "@/components/ui/numeric-input";
import { parseNumberForCalc } from "@/lib/forms/numeric-field";
import { calculateDebtPayoff } from "@/lib/finance/debt-strategies";
import type { Debt } from "@/types/database";
import { useMemo, useState } from "react";

export function CrisisPageClient({ debts }: { debts: Debt[] }) {
  const [extraPaymentInput, setExtraPaymentInput] = useState("");
  const extraPayment = parseNumberForCalc(extraPaymentInput);
  const multipleDebts = debts.length >= 2;

  const baseline = useMemo(
    () => calculateDebtPayoff(debts, 0, "avalanche"),
    [debts]
  );

  const withExtra = useMemo(
    () => calculateDebtPayoff(debts, extraPayment, "avalanche"),
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
        description="Что будет, если платить больше — сравнение сценариев погашения"
      />

      <div className="mb-6 max-w-xs">
        <NumericInput
          id="extra"
          label="Дополнительный платёж в месяц (₽)"
          mode="decimal"
          value={extraPaymentInput}
          onValueChange={setExtraPaymentInput}
          placeholder="5000"
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
        <div className="space-y-8">
          <CrisisScenarioComparison
            debts={debts}
            baseline={baseline}
            withExtra={withExtra}
            extraPayment={extraPayment}
          />

          {multipleDebts && avalanche && snowball && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h2 className="text-lg font-semibold">Детали стратегий</h2>
                <p className="text-sm text-muted">
                  Куда направить доплату при нескольких долгах — лавина или снежный ком
                </p>
              </div>
              <DebtPayoffBreakdown avalanche={avalanche} snowball={snowball} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
