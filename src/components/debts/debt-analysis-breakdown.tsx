"use client";

import { DebtAnalysisCard } from "@/components/debts/debt-analysis-card";
import type { Debt } from "@/types/database";

interface DebtAnalysisBreakdownProps {
  debts: Debt[];
}

export function DebtAnalysisBreakdown({ debts }: DebtAnalysisBreakdownProps) {
  if (debts.length === 0) return null;

  return (
    <div className="grid gap-3">
      {debts.map((debt) => (
        <DebtAnalysisCard key={debt.id} debt={debt} />
      ))}
    </div>
  );
}
