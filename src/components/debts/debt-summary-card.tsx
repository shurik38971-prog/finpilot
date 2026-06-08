"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  debtTermWarning,
  getDebtMonthlyPayment,
  getDebtOverpayment,
} from "@/lib/finance/debt-payment";
import { formatCurrency } from "@/lib/utils";
import { DEBT_PAYMENT_TYPE_LABELS, type Debt } from "@/types/database";
import { Pencil, Trash2 } from "lucide-react";

interface DebtSummaryCardProps {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
}

export function DebtSummaryCard({ debt, onEdit, onDelete }: DebtSummaryCardProps) {
  const monthlyPayment = getDebtMonthlyPayment(debt);
  const overpayment = getDebtOverpayment(debt);
  const termWarning = debtTermWarning(debt);
  const paymentType = debt.payment_type ?? "annuity";
  const progressPct =
    debt.total_amount > 0
      ? Math.round(
          ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
        )
      : 0;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{debt.title}</CardTitle>
            <CardDescription>
              {DEBT_PAYMENT_TYPE_LABELS[paymentType]}
              {debt.due_day ? ` · платёж ${debt.due_day}-го` : ""}
            </CardDescription>
          </div>
          <Badge variant="success">{progressPct}% погашено</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Сумма долга</dt>
            <dd className="font-medium">{formatCurrency(debt.remaining_amount)}</dd>
          </div>
          <div>
            <dt className="text-muted">Ставка</dt>
            <dd className="font-medium">{debt.interest_rate}% годовых</dd>
          </div>
          <div>
            <dt className="text-muted">Срок</dt>
            <dd className="font-medium">
              {debt.term_months ? `${debt.term_months} мес.` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Ежемесячный платёж</dt>
            <dd className="font-medium">{formatCurrency(monthlyPayment)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted">Примерная переплата</dt>
            <dd className="font-medium">
              {overpayment !== null ? formatCurrency(overpayment) : "—"}
            </dd>
          </div>
        </dl>

        {termWarning && (
          <p className="text-xs text-amber-400">{termWarning}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
