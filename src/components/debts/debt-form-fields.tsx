"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DebtPaymentPreview } from "@/components/debts/debt-payment-preview";
import {
  parseAnnualRateInput,
  getCalculatedMonthlyPayment,
} from "@/lib/finance/debt-payment";
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
    debt?.remaining_amount ? String(debt.remaining_amount) : ""
  );
  const [interestRateInput, setInterestRateInput] = useState(
    debt?.interest_rate != null ? String(debt.interest_rate).replace(".", ",") : ""
  );
  const [termMonths, setTermMonths] = useState(
    debt?.term_months ? String(debt.term_months) : ""
  );
  const [actualPayment, setActualPayment] = useState(
    debt?.actual_monthly_payment != null
      ? String(debt.actual_monthly_payment)
      : debt?.payment_type === "manual" && debt.minimum_payment > 0
        ? String(debt.minimum_payment)
        : ""
  );
  const [hasPersonalInterest, setHasPersonalInterest] = useState(
    debt?.debt_kind === "personal_loan"
      ? (debt.interest_rate ?? 0) > 0
      : false
  );

  const parsedRemaining = remainingAmount ? Number(remainingAmount) : 0;
  const parsedTerm = termMonths ? Number(termMonths) : null;
  const { rate: parsedRate, warning: rateWarning } = parseAnnualRateInput(
    interestRateInput
  );
  const effectiveRate =
    debtKind === "personal_loan" && !hasPersonalInterest ? 0 : parsedRate;
  const parsedActual = actualPayment.trim() ? Number(actualPayment) : null;

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

  const showInterestField =
    debtKind !== "personal_loan" || hasPersonalInterest;

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
        value={parsedRemaining > 0 ? parsedRemaining : debt?.total_amount ?? 0}
      />
      <input type="hidden" name="priority" value={debt?.priority ?? 0} />

      <Input
        id="remaining_amount"
        name="remaining_amount"
        label="Остаток долга, ₽"
        type="number"
        min="0.01"
        step="0.01"
        value={remainingAmount}
        onChange={(e) => setRemainingAmount(e.target.value)}
        required
        placeholder="150000"
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
                onChange={() => setHasPersonalInterest(false)}
              />
              Нет
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="has_personal_interest"
                value="1"
                checked={hasPersonalInterest}
                onChange={() => setHasPersonalInterest(true)}
              />
              Да
            </label>
          </div>
        </fieldset>
      )}

      {showInterestField ? (
        <Input
          id="interest_rate"
          name="interest_rate"
          label="Процентная ставка, % годовых"
          type="text"
          inputMode="decimal"
          value={interestRateInput}
          onChange={(e) => setInterestRateInput(e.target.value)}
          placeholder="Например, 29.2"
          required={debtKind !== "personal_loan"}
        />
      ) : (
        <input type="hidden" name="interest_rate" value="0" />
      )}

      {rateWarning && (
        <p className="text-xs text-amber-400">{rateWarning}</p>
      )}

      <Input
        id="term_months"
        name="term_months"
        label="Срок до полного погашения, месяцев"
        type="number"
        min="1"
        step="1"
        value={termMonths}
        onChange={(e) => setTermMonths(e.target.value)}
        placeholder="Например, 36"
        required
      />

      <Input
        id="due_day"
        name="due_day"
        label="День платежа (необязательно)"
        type="number"
        min="1"
        max="31"
        defaultValue={debt?.due_day ?? undefined}
        placeholder="1–31"
      />

      <DebtPaymentPreview
        calculatedPayment={calculatedPayment}
        actualPayment={parsedActual}
      />

      <div className="space-y-1.5">
        <Input
          id="actual_monthly_payment"
          name="actual_monthly_payment"
          label="Фактический ежемесячный платёж, ₽ (необязательно)"
          type="number"
          min="0"
          step="0.01"
          value={actualPayment}
          onChange={(e) => setActualPayment(e.target.value)}
          placeholder="Если знаете точный платёж по договору"
        />
        <p className="text-xs text-muted leading-relaxed">
          Укажите, если уже знаете точный платёж по договору. Если не знаете —
          ФинПилот рассчитает примерный платёж сам.
        </p>
      </div>
    </div>
  );
}
