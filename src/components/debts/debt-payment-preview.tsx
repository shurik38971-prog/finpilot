"use client";

import {
  ACTUAL_PAYMENT_MESSAGES,
  compareActualVsCalculated,
} from "@/lib/finance/debt-payment";
import { formatCurrency } from "@/lib/utils";

interface DebtPaymentPreviewProps {
  calculatedPayment: number | null;
  actualPayment: number | null;
}

export function DebtPaymentPreview({
  calculatedPayment,
  actualPayment,
}: DebtPaymentPreviewProps) {
  if (calculatedPayment == null || calculatedPayment <= 0) {
    return null;
  }

  const comparison = compareActualVsCalculated(actualPayment, calculatedPayment);
  const comparisonMessage = comparison
    ? ACTUAL_PAYMENT_MESSAGES[comparison]
    : null;

  return (
    <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-3 text-sm space-y-2">
      <p className="text-muted">Примерный платёж по этим условиям</p>
      <p className="text-lg font-semibold text-foreground">
        {formatCurrency(calculatedPayment)}/мес
      </p>
      {comparisonMessage && (
        <p className="text-xs text-foreground/80 leading-relaxed">
          {comparisonMessage}
        </p>
      )}
    </div>
  );
}
