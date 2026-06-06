import { getFinancialData } from "@/lib/actions/finance";
import { hasAnyProfileIncomeExpectation } from "@/types/profile-income";
import { AnalyzePageClient } from "./analyze-client";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const { incomes, expenses, profileIncome } = await getFinancialData();
  const hasIncome =
    incomes.length > 0 || hasAnyProfileIncomeExpectation(profileIncome);
  const hasExpense = expenses.length > 0;
  const canAnalyze = hasIncome && hasExpense;

  return (
    <AnalyzePageClient
      canAnalyze={canAnalyze}
      hasIncome={hasIncome}
      hasExpense={hasExpense}
    />
  );
}
