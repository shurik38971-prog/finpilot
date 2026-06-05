import { getFinancialData } from "@/lib/actions/finance";
import { hasFinancialData } from "@/lib/finance/index";
import { AnalyzePageClient } from "./analyze-client";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const { incomes, expenses, debts } = await getFinancialData();
  const isEmpty = !hasFinancialData(incomes, expenses, debts);

  return <AnalyzePageClient isEmpty={isEmpty} />;
}
