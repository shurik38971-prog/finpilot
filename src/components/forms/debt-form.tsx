"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDebt, updateDebt } from "@/lib/actions/finance";
import {
  calculateAnnuityPayment,
  DEBT_TERM_MISSING_WARNING,
} from "@/lib/finance/debt-payment";
import { formatCurrency } from "@/lib/utils";
import {
  DEBT_PAYMENT_TYPE_LABELS,
  type Debt,
  type DebtPaymentType,
} from "@/types/database";
import { useMemo, useState } from "react";

interface DebtFormProps {
  debt?: Debt;
  onSuccess: () => void;
}

export function DebtForm({ debt, onSuccess }: DebtFormProps) {
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<DebtPaymentType>(
    debt?.payment_type ?? "annuity"
  );
  const [remainingAmount, setRemainingAmount] = useState(
    debt?.remaining_amount ?? 0
  );
  const [interestRate, setInterestRate] = useState(debt?.interest_rate ?? 0);
  const [termMonths, setTermMonths] = useState(
    debt?.term_months ? String(debt.term_months) : ""
  );
  const [manualPayment, setManualPayment] = useState(
    debt?.minimum_payment ?? 0
  );

  const parsedTerm = termMonths ? Number(termMonths) : null;

  const annuityPayment = useMemo(() => {
    if (paymentType !== "annuity" || !parsedTerm || parsedTerm <= 0) {
      return null;
    }
    return Math.round(
      calculateAnnuityPayment(remainingAmount, interestRate, parsedTerm)
    );
  }, [paymentType, remainingAmount, interestRate, parsedTerm]);

  const previewOverpayment = useMemo(() => {
    if (!parsedTerm || parsedTerm <= 0 || remainingAmount <= 0) return null;
    const payment =
      paymentType === "annuity"
        ? annuityPayment
        : manualPayment;
    if (!payment || payment <= 0) return null;
    return Math.round(payment * parsedTerm - remainingAmount);
  }, [paymentType, annuityPayment, manualPayment, parsedTerm, remainingAmount]);

  const termWarning =
    paymentType === "annuity" && (!parsedTerm || parsedTerm <= 0)
      ? DEBT_TERM_MISSING_WARNING
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (debt) {
        await updateDebt(debt.id, formData);
      } else {
        await createDebt(formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="title"
        name="title"
        label="Название"
        defaultValue={debt?.title}
        required
        placeholder="Кредитная карта"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="total_amount"
          name="total_amount"
          label="Общая сумма (₽)"
          type="number"
          min="0"
          step="0.01"
          defaultValue={debt?.total_amount}
          required
        />
        <Input
          id="remaining_amount"
          name="remaining_amount"
          label="Остаток (₽)"
          type="number"
          min="0"
          step="0.01"
          defaultValue={debt?.remaining_amount}
          required
          onChange={(e) => setRemainingAmount(Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="interest_rate"
          name="interest_rate"
          label="Ставка (% годовых)"
          type="number"
          min="0"
          step="0.01"
          defaultValue={debt?.interest_rate ?? 0}
          required
          onChange={(e) => setInterestRate(Number(e.target.value))}
        />
        <Input
          id="term_months"
          name="term_months"
          label="Срок долга, месяцев"
          type="number"
          min="1"
          step="1"
          value={termMonths}
          onChange={(e) => setTermMonths(e.target.value)}
          placeholder="36"
        />
      </div>
      <Select
        id="payment_type"
        name="payment_type"
        label="Тип расчёта платежа"
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value as DebtPaymentType)}
        options={(
          Object.entries(DEBT_PAYMENT_TYPE_LABELS) as [DebtPaymentType, string][]
        ).map(([value, label]) => ({ value, label }))}
      />
      {paymentType === "manual" ? (
        <Input
          id="minimum_payment"
          name="minimum_payment"
          label="Ежемесячный платёж (₽)"
          type="number"
          min="0"
          step="0.01"
          value={manualPayment}
          onChange={(e) => setManualPayment(Number(e.target.value))}
          required
        />
      ) : (
        <>
          <input type="hidden" name="minimum_payment" value={annuityPayment ?? 0} />
          <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-3 text-sm space-y-1">
            <p className="text-muted">Ежемесячный платёж (аннуитет)</p>
            <p className="text-lg font-semibold text-foreground">
              {annuityPayment !== null
                ? formatCurrency(annuityPayment)
                : "—"}
            </p>
            {termWarning && (
              <p className="text-xs text-amber-400">{termWarning}</p>
            )}
          </div>
        </>
      )}
      {previewOverpayment !== null && previewOverpayment >= 0 && (
        <p className="text-sm text-muted">
          Примерная переплата:{" "}
          <span className="text-foreground font-medium">
            {formatCurrency(previewOverpayment)}
          </span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="due_day"
          name="due_day"
          label="День платежа"
          type="number"
          min="1"
          max="31"
          defaultValue={debt?.due_day ?? undefined}
        />
        <Input
          id="priority"
          name="priority"
          label="Приоритет"
          type="number"
          min="0"
          defaultValue={debt?.priority ?? 0}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : debt ? "Обновить" : "Добавить"}
      </Button>
    </form>
  );
}
