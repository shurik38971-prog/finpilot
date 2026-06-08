"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDebtMonthlyPayment } from "@/lib/finance/debt-payment";
import { formatCurrency } from "@/lib/utils";
import type { Debt, DebtPayoffPlan } from "@/types/database";
import { addMonths, format } from "date-fns";
import { ru } from "date-fns/locale";

interface SingleDebtForecastProps {
  debt: Debt;
  plan: DebtPayoffPlan;
  extraPayment: number;
}

function formatClosingMonth(monthsFromNow: number): string {
  return format(addMonths(new Date(), monthsFromNow), "LLLL yyyy", { locale: ru });
}

export function SingleDebtForecast({
  debt,
  plan,
  extraPayment,
}: SingleDebtForecastProps) {
  const basePayment = getDebtMonthlyPayment(debt);
  const totalMonthly = basePayment + extraPayment;
  const canClose = plan.status === "complete" && plan.monthsToFreedom > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Прогноз погашения</CardTitle>
          {plan.status === "unpayable" && (
            <Badge variant="danger">Непогашаем при текущих платежах</Badge>
          )}
          {plan.status === "max_months_reached" && (
            <Badge variant="warning">Расчёт обрезан по лимиту срока</Badge>
          )}
        </div>
        <CardDescription>{debt.title}</CardDescription>
      </CardHeader>

      <div className="px-5 pb-5 space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted">Остаток долга</dt>
            <dd className="text-xl font-bold">
              {formatCurrency(debt.remaining_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Ежемесячный платёж</dt>
            <dd className="text-xl font-bold">{formatCurrency(totalMonthly)}</dd>
            {extraPayment > 0 && (
              <p className="text-xs text-muted mt-1">
                {formatCurrency(basePayment)} базовый + {formatCurrency(extraPayment)} доп.
              </p>
            )}
          </div>
          <div>
            <dt className="text-sm text-muted">Срок закрытия</dt>
            <dd className="text-xl font-bold">
              {canClose ? (
                <>
                  {plan.monthsToFreedom} мес.
                  <span className="block text-sm font-normal text-muted mt-0.5 capitalize">
                    {formatClosingMonth(plan.monthsToFreedom)}
                  </span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Переплата</dt>
            <dd className="text-xl font-bold text-red-400">
              {canClose ? formatCurrency(plan.totalInterest) : "—"}
            </dd>
          </div>
        </dl>

        {plan.warnings.length > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5">
            {plan.warnings.map((warning) => (
              <p key={warning} className="text-xs text-yellow-200/90 leading-relaxed">
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
