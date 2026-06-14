"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compareActualVsCalculated,
  getActualPaymentMessage,
  resolveCalculatedMonthlyPayment,
} from "@/lib/finance/debt-payment";
import { formatCurrency } from "@/lib/utils";
import { DEBT_KIND_LABELS, type Debt } from "@/types/database";

interface DebtAnalysisCardProps {
  debt: Debt;
}

export function DebtAnalysisCard({ debt }: DebtAnalysisCardProps) {
  const calculated = resolveCalculatedMonthlyPayment(debt);
  const actual =
    debt.actual_monthly_payment != null && debt.actual_monthly_payment > 0
      ? debt.actual_monthly_payment
      : null;
  const comparison = compareActualVsCalculated(actual, calculated);
  const warning = getActualPaymentMessage(comparison);

  return (
    <Card className="!p-0">
      <CardHeader className="space-y-3 p-4 sm:p-5">
        <div>
          <CardTitle className="text-base">{debt.title}</CardTitle>
          <CardDescription>{DEBT_KIND_LABELS[debt.debt_kind ?? "other"]}</CardDescription>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Остаток долга</dt>
            <dd className="font-medium">{formatCurrency(debt.remaining_amount)}</dd>
          </div>
          <div>
            <dt className="text-muted">Ставка</dt>
            <dd className="font-medium">{debt.interest_rate}% годовых</dd>
          </div>
          <div>
            <dt className="text-muted">Примерный платёж</dt>
            <dd className="font-medium">
              {calculated > 0 ? `${formatCurrency(calculated)}/мес` : "—"}
            </dd>
          </div>
          {actual != null && (
            <div>
              <dt className="text-muted">Фактический платёж</dt>
              <dd className="font-medium">{formatCurrency(actual)}/мес</dd>
            </div>
          )}
        </dl>
        {warning && (
          <p className="text-xs text-amber-400/90 leading-relaxed">{warning}</p>
        )}
      </CardHeader>
    </Card>
  );
}
