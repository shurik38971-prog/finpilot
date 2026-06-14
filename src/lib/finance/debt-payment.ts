import type { Debt, DebtKind } from "@/types/database";

export const DEBT_TERM_MISSING_WARNING =
  "Укажите срок долга для точного расчёта.";

export const DEBT_RATE_HIGH_WARNING =
  "Проверьте ставку. Укажите годовую ставку в процентах, например 29.2.";

export const ACTUAL_PAYMENT_MESSAGES = {
  higher:
    "Вы указали платёж выше расчётного. Возможно, долг будет закрываться быстрее.",
  lower:
    "Вы указали платёж ниже расчётного. Проверьте условия договора: срок может быть больше или расчёт отличается от банковского графика.",
  close: "Фактический платёж близок к расчётному.",
} as const;

export type ActualVsCalculatedComparison = keyof typeof ACTUAL_PAYMENT_MESSAGES | null;

const VALID_DEBT_KINDS: DebtKind[] = [
  "credit",
  "credit_card",
  "microloan",
  "installment",
  "personal_loan",
  "other",
];

export function normalizeDebt(row: Debt): Debt {
  return {
    ...row,
    debt_kind: (row.debt_kind ?? "other") as DebtKind,
    payment_type: row.payment_type ?? "annuity",
    calculated_monthly_payment: row.calculated_monthly_payment ?? null,
    actual_monthly_payment:
      row.actual_monthly_payment ??
      (row.payment_type === "manual" && row.minimum_payment > 0
        ? row.minimum_payment
        : null),
  };
}

export function parseDebtKind(value: FormDataEntryValue | null): DebtKind {
  if (typeof value === "string" && VALID_DEBT_KINDS.includes(value as DebtKind)) {
    return value as DebtKind;
  }
  return "other";
}

export function parseAnnualRateInput(raw: string): {
  rate: number;
  warning: string | null;
} {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return { rate: 0, warning: null };
  }

  const rate = Number(normalized);
  if (!Number.isFinite(rate) || rate < 0) {
    return { rate: 0, warning: "Укажите корректную ставку в процентах." };
  }

  const warning = rate > 100 ? DEBT_RATE_HIGH_WARNING : null;
  return { rate, warning };
}

export function calculateAnnuityPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  if (annualRatePercent === 0) {
    return principal / termMonths;
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function getCalculatedMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  return Math.round(
    calculateAnnuityPayment(principal, annualRatePercent, termMonths)
  );
}

export function resolveCalculatedMonthlyPayment(debt: Debt): number {
  if (
    debt.calculated_monthly_payment != null &&
    debt.calculated_monthly_payment > 0
  ) {
    return debt.calculated_monthly_payment;
  }

  if (debt.term_months && debt.term_months > 0 && debt.remaining_amount > 0) {
    return getCalculatedMonthlyPayment(
      debt.remaining_amount,
      debt.interest_rate,
      debt.term_months
    );
  }

  return 0;
}

export function getMonthlyPaymentForAnalysis(debt: Debt): number {
  if (debt.actual_monthly_payment != null && debt.actual_monthly_payment > 0) {
    return debt.actual_monthly_payment;
  }

  const calculated = resolveCalculatedMonthlyPayment(debt);
  if (calculated > 0) {
    return calculated;
  }

  return debt.minimum_payment;
}

export function getDebtMonthlyPayment(debt: Debt): number {
  return getMonthlyPaymentForAnalysis(debt);
}

export function compareActualVsCalculated(
  actual: number | null | undefined,
  calculated: number | null | undefined
): ActualVsCalculatedComparison {
  if (!actual || actual <= 0 || !calculated || calculated <= 0) {
    return null;
  }

  const ratio = actual / calculated;
  if (ratio > 1.02) return "higher";
  if (ratio < 0.98) return "lower";
  return "close";
}

export function getActualPaymentMessage(
  comparison: ActualVsCalculatedComparison
): string | null {
  if (!comparison) return null;
  return ACTUAL_PAYMENT_MESSAGES[comparison];
}

export function getDebtOverpayment(debt: Debt): number | null {
  if (!debt.term_months || debt.term_months <= 0) return null;

  const monthlyPayment = getMonthlyPaymentForAnalysis(debt);
  const totalPaid = monthlyPayment * debt.term_months;
  return Math.round(totalPaid - debt.remaining_amount);
}

export function isDebtTermMissing(debt: Debt): boolean {
  return !debt.term_months || debt.term_months <= 0;
}

export function debtTermWarning(debt: Debt): string | null {
  return isDebtTermMissing(debt) ? DEBT_TERM_MISSING_WARNING : null;
}

/** @deprecated Legacy form parser */
export function parseDebtPaymentType(value: FormDataEntryValue | null): "annuity" | "manual" {
  return value === "manual" ? "manual" : "annuity";
}

export function buildDebtPaymentFields(input: {
  remaining_amount: number;
  interest_rate: number;
  term_months: number | null;
  actual_monthly_payment: number | null;
}) {
  const calculated_monthly_payment =
    input.term_months && input.term_months > 0 && input.remaining_amount > 0
      ? getCalculatedMonthlyPayment(
          input.remaining_amount,
          input.interest_rate,
          input.term_months
        )
      : null;

  const monthlyPaymentForAnalysis =
    input.actual_monthly_payment != null && input.actual_monthly_payment > 0
      ? input.actual_monthly_payment
      : (calculated_monthly_payment ?? 0);

  return {
    calculated_monthly_payment,
    actual_monthly_payment: input.actual_monthly_payment,
    minimum_payment: monthlyPaymentForAnalysis,
    payment_type: "annuity" as const,
  };
}

export function parseDebtFormData(formData: FormData) {
  const debt_kind = parseDebtKind(formData.get("debt_kind"));
  const remaining_amount = Number(formData.get("remaining_amount"));
  const { rate: interest_rate } = parseAnnualRateInput(
    String(formData.get("interest_rate") ?? "")
  );
  const termRaw = formData.get("term_months");
  const term_months = termRaw ? Number(termRaw) : null;
  const actualRaw = formData.get("actual_monthly_payment");
  const actual_monthly_payment =
    actualRaw && String(actualRaw).trim() ? Number(actualRaw) : null;
  const totalRaw = formData.get("total_amount");
  const total_amount = totalRaw ? Number(totalRaw) : remaining_amount;
  const dueDayRaw = formData.get("due_day");

  const paymentFields = buildDebtPaymentFields({
    remaining_amount,
    interest_rate,
    term_months: term_months && term_months > 0 ? term_months : null,
    actual_monthly_payment:
      actual_monthly_payment != null && actual_monthly_payment > 0
        ? actual_monthly_payment
        : null,
  });

  return {
    debt_kind,
    title: String(formData.get("title") ?? ""),
    total_amount,
    remaining_amount,
    interest_rate,
    term_months: term_months && term_months > 0 ? term_months : null,
    due_day:
      dueDayRaw && String(dueDayRaw).trim() ? Number(dueDayRaw) : null,
    priority: Number(formData.get("priority") || 0),
    ...paymentFields,
  };
}
