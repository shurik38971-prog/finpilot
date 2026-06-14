"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compareActualVsCalculated,
  debtTermWarning,
  getActualPaymentMessage,
  getDebtOverpayment,
  resolveCalculatedMonthlyPayment,
} from "@/lib/finance/debt-payment";
import { assessDebtRecord } from "@/lib/finance/debt-priority";
import { formatCurrency } from "@/lib/utils";
import { DEBT_KIND_LABELS, type Debt } from "@/types/database";
import { Pencil, Trash2 } from "lucide-react";
import { DebtPriorityInsight } from "@/components/debts/debt-priority-insight";

interface DebtSummaryCardProps {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
}

export function DebtSummaryCard({ debt, onEdit, onDelete }: DebtSummaryCardProps) {
  const calculated = resolveCalculatedMonthlyPayment(debt);
  const actual =
    debt.actual_monthly_payment != null && debt.actual_monthly_payment > 0
      ? debt.actual_monthly_payment
      : null;
  const overpayment = getDebtOverpayment(debt);
  const termWarning = debtTermWarning(debt);
  const comparison = compareActualVsCalculated(actual, calculated);
  const paymentWarning = getActualPaymentMessage(comparison);
  const progressPct =
    debt.total_amount > 0
      ? Math.round(
          ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
        )
      : 0;
  const priority = assessDebtRecord(debt);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{debt.title}</CardTitle>
            <CardDescription>
              {DEBT_KIND_LABELS[debt.debt_kind ?? "other"]}
              {debt.due_day ? ` · платёж ${debt.due_day}-го` : ""}
            </CardDescription>
          </div>
          <Badge variant="success">{progressPct}% погашено</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Остаток долга</dt>
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
            <dt className="text-muted">Примерный платёж</dt>
            <dd className="font-medium">
              {calculated > 0 ? formatCurrency(calculated) : "—"}
            </dd>
          </div>
          {actual != null && (
            <div>
              <dt className="text-muted">Фактический платёж</dt>
              <dd className="font-medium">{formatCurrency(actual)}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-muted">Примерная переплата</dt>
            <dd className="font-medium">
              {overpayment !== null ? formatCurrency(overpayment) : "—"}
            </dd>
          </div>
        </dl>

        {paymentWarning && (
          <p className="text-xs text-amber-400 leading-relaxed">{paymentWarning}</p>
        )}
        {termWarning && (
          <p className="text-xs text-amber-400">{termWarning}</p>
        )}

        {debt.is_overdue && (
          <p className="text-xs text-red-400">Есть просрочка по этому долгу.</p>
        )}

        {debt.notes && (
          <p className="text-xs text-muted leading-relaxed">{debt.notes}</p>
        )}

        <DebtPriorityInsight assessment={priority} />

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
