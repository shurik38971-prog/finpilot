"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import {
  buildStrategyComparison,
  strategyLabel,
} from "@/lib/finance/debt-strategies";
import type { DebtPayoffPlan, DebtPayoffStatus } from "@/types/database";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function statusBadge(status: DebtPayoffStatus) {
  if (status === "complete") return null;
  if (status === "unpayable") {
    return <Badge variant="danger">Непогашаем при текущих платежах</Badge>;
  }
  return <Badge variant="warning">Расчёт обрезан по лимиту срока</Badge>;
}


function InputTable({ plan }: { plan: DebtPayoffPlan }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted border-b border-border/40">
            <th className="py-2 pr-2 font-medium">Долг</th>
            <th className="py-2 pr-2 font-medium">Остаток</th>
            <th className="py-2 pr-2 font-medium">Ставка</th>
            <th className="py-2 pr-2 font-medium">Срок</th>
            <th className="py-2 pr-2 font-medium">Платёж</th>
            <th className="py-2 pr-2 font-medium">Переплата</th>
            <th className="py-2 font-medium">% за 1-й мес</th>
          </tr>
        </thead>
        <tbody>
          {plan.inputSnapshot.map((row) => (
            <tr key={row.id} className="border-b border-border/20">
              <td className="py-2 pr-2">{row.title}</td>
              <td className="py-2 pr-2">{formatCurrency(row.initialBalance)}</td>
              <td className="py-2 pr-2">{row.annualRatePercent}%</td>
              <td className="py-2 pr-2">
                {row.termMonths ? `${row.termMonths} мес.` : "—"}
              </td>
              <td className="py-2 pr-2">{formatCurrency(row.minimumPayment)}</td>
              <td className="py-2 pr-2">
                {row.overpayment !== null ? formatCurrency(row.overpayment) : "—"}
              </td>
              <td className="py-2">{formatCurrency(row.firstMonthInterest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerTable({ plan }: { plan: DebtPayoffPlan }) {
  const [open, setOpen] = useState(false);
  const preview = plan.ledger.slice(0, open ? plan.ledger.length : 8);

  if (plan.ledger.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-accent hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? "Скрыть помесячный расчёт" : `Показать помесячный расчёт (${plan.ledger.length} строк)`}
      </button>

      <div className="max-h-72 overflow-auto rounded-lg border border-border/40">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-left text-muted border-b border-border/40">
              <th className="p-2 font-medium">Мес</th>
              <th className="p-2 font-medium">Долг</th>
              <th className="p-2 font-medium">Тип</th>
              <th className="p-2 font-medium">До</th>
              <th className="p-2 font-medium">Проценты</th>
              <th className="p-2 font-medium">Платёж</th>
              <th className="p-2 font-medium">В проценты</th>
              <th className="p-2 font-medium">На основной долг</th>
              <th className="p-2 font-medium">После</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((row, index) => (
              <tr key={`${row.month}-${row.debtTitle}-${row.paymentType}-${index}`} className="border-b border-border/20">
                <td className="p-2">{row.month}</td>
                <td className="p-2">{row.debtTitle}</td>
                <td className="p-2 text-muted">
                  {row.paymentType === "monthly"
                    ? "итого"
                    : row.paymentType === "minimum"
                      ? "мин."
                      : "доп."}
                </td>
                <td className="p-2">{formatCurrency(row.balanceBefore)}</td>
                <td className="p-2 text-red-400">{formatCurrency(row.interestAccrued)}</td>
                <td className="p-2">{formatCurrency(row.paymentTotal)}</td>
                <td className="p-2">{formatCurrency(row.paymentToInterest)}</td>
                <td className="p-2 text-emerald-400">{formatCurrency(row.paymentToPrincipal)}</td>
                <td className="p-2">{formatCurrency(row.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StrategyCardProps {
  plan: DebtPayoffPlan;
  isBetter: boolean;
}

function StrategyCard({ plan, isBetter }: StrategyCardProps) {
  return (
    <Card
      className={cn(
        plan.status !== "complete" && "border-yellow-500/40",
        isBetter && plan.status === "complete" && "border-emerald-500/30"
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{strategyLabel(plan.strategy)}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {isBetter && plan.status === "complete" && (
              <Badge variant="success">Меньше процентов</Badge>
            )}
            {statusBadge(plan.status)}
          </div>
        </div>
        <CardDescription>
          {plan.strategy === "avalanche"
            ? "Сначала долг с наивысшей ставкой"
            : "Сначала самый маленький остаток"}
          {" · "}
          доплата {formatCurrency(plan.extraPayment)}/мес
        </CardDescription>
      </CardHeader>

      <div className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted">Срок</p>
            <p className="text-xl font-bold">{plan.monthsToFreedom} мес.</p>
          </div>
          <div>
            <p className="text-sm text-muted">Всего процентов</p>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(plan.totalInterest)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Всего выплат</p>
            <p className="text-xl font-bold">{formatCurrency(plan.totalPaid)}</p>
          </div>
        </div>

        {plan.warnings.length > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5">
            {plan.warnings.map((warning) => (
              <p key={warning} className="text-xs text-yellow-200/90 leading-relaxed">
                {warning}
              </p>
            ))}
          </div>
        )}

        <LedgerTable plan={plan} />
      </div>
    </Card>
  );
}

interface DebtPayoffBreakdownProps {
  avalanche: DebtPayoffPlan;
  snowball: DebtPayoffPlan;
}

export function DebtPayoffBreakdown({
  avalanche,
  snowball,
}: DebtPayoffBreakdownProps) {
  const better =
    avalanche.status === "complete" &&
    snowball.status === "complete" &&
    avalanche.totalInterest <= snowball.totalInterest
      ? "avalanche"
      : snowball.status === "complete" &&
          (avalanche.status !== "complete" ||
            snowball.totalInterest < avalanche.totalInterest)
        ? "snowball"
        : null;

  const comparison = buildStrategyComparison(avalanche, snowball);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Исходные данные</CardTitle>
          <CardDescription>
            Входные цифры по каждому долгу
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5 space-y-4">
          <InputTable plan={avalanche} />
          <div className="rounded-lg border border-border/60 bg-accent/5 p-3 text-sm text-muted leading-relaxed">
            <span className="font-medium text-foreground">Почему один сценарий выгоднее: </span>
            {comparison}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyCard plan={avalanche} isBetter={better === "avalanche"} />
        <StrategyCard plan={snowball} isBetter={better === "snowball"} />
      </div>
    </div>
  );
}
