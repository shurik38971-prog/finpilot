"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  sumBaseMonthlyPayments,
  totalDebtRemaining,
} from "@/lib/finance/debt-strategies";
import { cn, formatCurrency } from "@/lib/utils";
import type { Debt, DebtPayoffPlan } from "@/types/database";
import { addMonths, format } from "date-fns";
import { ru } from "date-fns/locale";

interface CrisisScenarioComparisonProps {
  debts: Debt[];
  baseline: DebtPayoffPlan;
  withExtra: DebtPayoffPlan;
  extraPayment: number;
}

function formatClosingMonth(monthsFromNow: number): string {
  return format(addMonths(new Date(), monthsFromNow), "LLLL yyyy", {
    locale: ru,
  });
}

function FormulaBlock() {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-3 text-sm space-y-2">
      <p className="font-medium text-foreground">Формула расчёта (один раз в месяц)</p>
      <div className="font-mono text-xs text-muted space-y-1">
        <p>месячная ставка = годовая ставка ÷ 12 ÷ 100</p>
        <p>проценты = остаток на начало месяца × месячная ставка</p>
        <p>платёж = базовый + дополнительный</p>
        <p>в проценты = min(платёж, проценты)</p>
        <p>в тело = платёж − в проценты</p>
        <p>новый остаток = остаток + проценты − платёж</p>
      </div>
    </div>
  );
}

function ScenarioMetrics({
  title,
  description,
  debtFieldLabel,
  totalDebt,
  monthlyPayment,
  months,
  overpayment,
  status,
  highlight,
}: {
  title: string;
  description?: string;
  debtFieldLabel: string;
  totalDebt: number;
  monthlyPayment: number;
  months: number;
  overpayment: number;
  status: DebtPayoffPlan["status"];
  highlight?: boolean;
}) {
  const complete = status === "complete" && months > 0;

  return (
    <Card className={cn(highlight && "border-emerald-500/30")}>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">{debtFieldLabel}</dt>
            <dd className="text-lg font-semibold">{formatCurrency(totalDebt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Ежемесячный платёж</dt>
            <dd className="text-lg font-semibold">{formatCurrency(monthlyPayment)}</dd>
          </div>
          <div>
            <dt className="text-muted">Срок закрытия</dt>
            <dd className="text-lg font-semibold">
              {complete ? (
                <>
                  {months} мес.
                  <span className="block text-xs font-normal text-muted mt-0.5 capitalize">
                    {formatClosingMonth(months)}
                  </span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Переплата</dt>
            <dd className="text-lg font-semibold text-red-400">
              {complete ? formatCurrency(overpayment) : "—"}
            </dd>
          </div>
        </dl>

        {status === "unpayable" && (
          <Badge variant="danger">Непогашаем при текущих платежах</Badge>
        )}
        {status === "max_months_reached" && (
          <Badge variant="warning">Расчёт обрезан по лимиту срока</Badge>
        )}
      </CardHeader>
    </Card>
  );
}

function BenefitCard({
  monthsSaved,
  interestSaved,
  hasExtra,
}: {
  monthsSaved: number;
  interestSaved: number;
  hasExtra: boolean;
}) {
  if (!hasExtra) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Выгода</CardTitle>
          <CardDescription>
            Укажите дополнительный платёж, чтобы увидеть экономию времени и процентов
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const positiveMonths = monthsSaved > 0;
  const positiveInterest = interestSaved > 0;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Выгода</CardTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Экономия времени</dt>
            <dd className="text-xl font-bold text-emerald-400">
              {positiveMonths
                ? `${monthsSaved} ${monthWord(monthsSaved)}`
                : "Срок не сократился"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Экономия процентов</dt>
            <dd className="text-xl font-bold text-emerald-400">
              {positiveInterest
                ? formatCurrency(interestSaved)
                : "Переплата не снизилась"}
            </dd>
          </div>
        </dl>
      </CardHeader>
    </Card>
  );
}

function monthWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "месяцев";
  if (mod10 === 1) return "месяц";
  if (mod10 >= 2 && mod10 <= 4) return "месяца";
  return "месяцев";
}

export function CrisisScenarioComparison({
  debts,
  baseline,
  withExtra,
  extraPayment,
}: CrisisScenarioComparisonProps) {
  const totalDebt = totalDebtRemaining(debts);
  const baseMonthly = sumBaseMonthlyPayments(debts);
  const hasExtra = extraPayment > 0;

  const monthsSaved = Math.max(
    0,
    baseline.monthsToFreedom - withExtra.monthsToFreedom
  );
  const interestSaved = Math.max(
    0,
    baseline.totalInterest - withExtra.totalInterest
  );

  const debtFieldLabel = debts.length === 1 ? "Ваш долг" : "Сумма долгов";
  const debtSubtitle =
    debts.length === 1 ? debts[0].title : `${debts.length} активных долга`;

  const warnings = [...new Set([...baseline.warnings, ...withExtra.warnings])];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Что будет, если платить больше?
        </h2>
        <p className="text-sm text-muted">
          Сравнение текущего графика и сценария с дополнительным платежом
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScenarioMetrics
          title="Базовый сценарий"
          description={debtSubtitle}
          debtFieldLabel={debtFieldLabel}
          totalDebt={totalDebt}
          monthlyPayment={baseMonthly}
          months={baseline.monthsToFreedom}
          overpayment={baseline.totalInterest}
          status={baseline.status}
        />
        <ScenarioMetrics
          title="С дополнительным платежом"
          description={
            hasExtra
              ? `Доплата ${formatCurrency(extraPayment)} / месяц · ${debtSubtitle}`
              : debtSubtitle
          }
          debtFieldLabel={debtFieldLabel}
          totalDebt={totalDebt}
          monthlyPayment={baseMonthly + extraPayment}
          months={withExtra.monthsToFreedom}
          overpayment={withExtra.totalInterest}
          status={withExtra.status}
          highlight={hasExtra}
        />
      </div>

      <BenefitCard
        monthsSaved={monthsSaved}
        interestSaved={interestSaved}
        hasExtra={hasExtra}
      />

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5">
          {warnings.map((warning) => (
            <p key={warning} className="text-xs text-yellow-200/90 leading-relaxed">
              {warning}
            </p>
          ))}
        </div>
      )}

      <FormulaBlock />
    </div>
  );
}
