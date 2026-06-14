"use client";

import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select } from "@/components/ui/select";
import { DebtPaymentPreview } from "@/components/debts/debt-payment-preview";
import { DebtPriorityInsight } from "@/components/debts/debt-priority-insight";
import {
  numberToFieldValue,
  parseNumberForCalc,
  parseOptionalInteger,
  parseOptionalNumber,
  rateToFieldValue,
} from "@/lib/forms/numeric-field";
import {
  parseAnnualRateInput,
  getCalculatedMonthlyPayment,
} from "@/lib/finance/debt-payment";
import { assessDebtPriority } from "@/lib/finance/debt-priority";
import {
  DEBT_KIND_LABELS,
  DEBT_KIND_TITLE_PLACEHOLDERS,
  type Debt,
  type DebtKind,
} from "@/types/database";
import { useMemo, useState } from "react";

const DEBT_KIND_OPTIONS = (
  Object.entries(DEBT_KIND_LABELS) as [DebtKind, string][]
).map(([value, label]) => ({ value, label }));

export interface DebtFormFieldsProps {
  debt?: Debt;
}

export function DebtFormFields({ debt }: DebtFormFieldsProps) {
  const [debtKind, setDebtKind] = useState<DebtKind>(debt?.debt_kind ?? "credit");
  const [remainingAmount, setRemainingAmount] = useState(
    numberToFieldValue(debt?.remaining_amount)
  );
  const [interestRateInput, setInterestRateInput] = useState(
    rateToFieldValue(debt?.interest_rate)
  );
  const [termMonths, setTermMonths] = useState(
    numberToFieldValue(debt?.term_months, { showZero: false })
  );
  const [dueDay, setDueDay] = useState(numberToFieldValue(debt?.due_day));
  const [actualPayment, setActualPayment] = useState(() => {
    if (debt?.actual_monthly_payment != null && debt.actual_monthly_payment > 0) {
      return numberToFieldValue(debt.actual_monthly_payment);
    }
    if (debt?.payment_type === "manual" && debt.minimum_payment > 0) {
      return numberToFieldValue(debt.minimum_payment);
    }
    return "";
  });
  const [hasPersonalInterest, setHasPersonalInterest] = useState(
    debt?.debt_kind === "personal_loan"
      ? (debt.interest_rate ?? 0) > 0
      : false
  );
  const [isOverdue, setIsOverdue] = useState(debt?.is_overdue ?? false);

  const parsedRemaining = parseNumberForCalc(remainingAmount);
  const parsedTerm = parseOptionalInteger(termMonths);
  const { rate: parsedRate, warning: rateWarning } = parseAnnualRateInput(
    interestRateInput
  );
  const effectiveRate =
    debtKind === "personal_loan" && !hasPersonalInterest ? 0 : parsedRate;
  const parsedActual = parseOptionalNumber(actualPayment);

  const calculatedPayment = useMemo(() => {
    if (!parsedTerm || parsedTerm <= 0 || parsedRemaining <= 0) {
      return null;
    }
    return getCalculatedMonthlyPayment(
      parsedRemaining,
      effectiveRate,
      parsedTerm
    );
  }, [parsedRemaining, effectiveRate, parsedTerm]);

  const parsedDueDay = parseOptionalInteger(dueDay);

  const priorityPreview = useMemo(() => {
    const monthlyPayment =
      parsedActual != null && parsedActual > 0
        ? parsedActual
        : (calculatedPayment ?? 0);

    return assessDebtPriority({
      debt_kind: debtKind,
      interest_rate: effectiveRate,
      remaining_amount: parsedRemaining,
      monthly_payment: monthlyPayment,
      is_overdue: isOverdue,
      due_day: parsedDueDay,
    });
  }, [
    debtKind,
    effectiveRate,
    parsedRemaining,
    parsedActual,
    calculatedPayment,
    isOverdue,
    parsedDueDay,
  ]);

  const showInterestField =
    debtKind !== "personal_loan" || hasPersonalInterest;

  function handlePersonalInterestChange(withInterest: boolean) {
    setHasPersonalInterest(withInterest);
    if (withInterest) {
      setInterestRateInput("");
    }
  }

  return (
    <div className="space-y-4">
      <Select
        id="debt_kind"
        name="debt_kind"
        label="Тип долга"
        value={debtKind}
        onChange={(e) => setDebtKind(e.target.value as DebtKind)}
        options={DEBT_KIND_OPTIONS}
      />

      <Input
        id="title"
        name="title"
        label="Название долга"
        defaultValue={debt?.title}
        required
        placeholder={DEBT_KIND_TITLE_PLACEHOLDERS[debtKind]}
      />

      <input
        type="hidden"
        name="total_amount"
        value={parsedRemaining > 0 ? parsedRemaining : debt?.total_amount ?? ""}
      />

      <NumericInput
        id="remaining_amount"
        name="remaining_amount"
        label="Остаток долга, ₽"
        mode="decimal"
        value={remainingAmount}
        onValueChange={setRemainingAmount}
        required
        placeholder="50000"
      />

      {debtKind === "personal_loan" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Долг с процентами?
          </legend>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="has_personal_interest"
                value="0"
                checked={!hasPersonalInterest}
                onChange={() => handlePersonalInterestChange(false)}
              />
              Нет
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="has_personal_interest"
                value="1"
                checked={hasPersonalInterest}
                onChange={() => handlePersonalInterestChange(true)}
              />
              Да
            </label>
          </div>
        </fieldset>
      )}

      {showInterestField ? (
        <NumericInput
          id="interest_rate"
          name="interest_rate"
          label="Процентная ставка, % годовых"
          mode="decimal"
          value={interestRateInput}
          onValueChange={setInterestRateInput}
          placeholder={
            debtKind === "personal_loan" ? "Например, 10" : "Например, 29.2"
          }
          required={debtKind !== "personal_loan"}
        />
      ) : (
        <input type="hidden" name="interest_rate" value="" />
      )}

      {rateWarning && (
        <p className="text-xs text-amber-400">{rateWarning}</p>
      )}

      <NumericInput
        id="term_months"
        name="term_months"
        label="Срок до полного погашения, месяцев"
        mode="integer"
        value={termMonths}
        onValueChange={setTermMonths}
        placeholder="Например, 36"
        required
      />

      <NumericInput
        id="due_day"
        name="due_day"
        label="День платежа (необязательно)"
        mode="integer"
        value={dueDay}
        onValueChange={setDueDay}
        placeholder="Например, 15"
      />

      <DebtPaymentPreview
        calculatedPayment={calculatedPayment}
        actualPayment={parsedActual}
      />

      <div className="space-y-1.5">
        <NumericInput
          id="actual_monthly_payment"
          name="actual_monthly_payment"
          label="Фактический ежемесячный платёж, ₽ (необязательно)"
          mode="decimal"
          value={actualPayment}
          onValueChange={setActualPayment}
          placeholder="Если знаете точный платёж по договору"
        />
        <p className="text-xs text-muted leading-relaxed">
          Укажите, если уже знаете точный платёж по договору. Если не знаете —
          ФинПилот рассчитает примерный платёж сам.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_overdue"
          checked={isOverdue}
          onChange={(e) => setIsOverdue(e.target.checked)}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">
            Есть просрочка?
          </span>
          <span className="block text-xs text-muted leading-relaxed">
            Отметьте, если по этому долгу уже есть просроченные платежи.
          </span>
        </span>
      </label>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm text-muted">
          Комментарий (необязательно)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={debt?.notes ?? ""}
          placeholder="Например: договорились с банком об отсрочке"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y min-h-[4.5rem]"
        />
      </div>

      <DebtPriorityInsight assessment={priorityPreview} />
    </div>
  );
}
