import type { Debt, DebtPaymentType } from "@/types/database";

export const DEBT_TERM_MISSING_WARNING =
  "Укажите срок долга для точного расчёта.";

export function calculateAnnuityPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  if (annualRatePercent === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function getDebtMonthlyPayment(debt: Debt): number {
  const paymentType = debt.payment_type ?? "annuity";

  if (paymentType === "manual") {
    return debt.minimum_payment;
  }

  if (debt.term_months && debt.term_months > 0) {
    return Math.round(
      calculateAnnuityPayment(
        debt.remaining_amount,
        debt.interest_rate,
        debt.term_months
      )
    );
  }

  return debt.minimum_payment;
}

export function getDebtOverpayment(debt: Debt): number | null {
  if (!debt.term_months || debt.term_months <= 0) return null;

  const monthlyPayment = getDebtMonthlyPayment(debt);
  const totalPaid = monthlyPayment * debt.term_months;
  return Math.round(totalPaid - debt.remaining_amount);
}

export function isDebtTermMissing(debt: Debt): boolean {
  return !debt.term_months || debt.term_months <= 0;
}

export function debtTermWarning(debt: Debt): string | null {
  return isDebtTermMissing(debt) ? DEBT_TERM_MISSING_WARNING : null;
}

export function parseDebtPaymentType(value: FormDataEntryValue | null): DebtPaymentType {
  return value === "manual" ? "manual" : "annuity";
}

export function resolveDebtMinimumPayment(input: {
  payment_type: DebtPaymentType;
  remaining_amount: number;
  interest_rate: number;
  term_months: number | null;
  manual_payment: number;
}): number {
  if (input.payment_type === "manual") {
    return input.manual_payment;
  }

  if (input.term_months && input.term_months > 0) {
    return Math.round(
      calculateAnnuityPayment(
        input.remaining_amount,
        input.interest_rate,
        input.term_months
      )
    );
  }

  return input.manual_payment;
}
