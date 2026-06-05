import { ExpensesPageClient } from "./expenses-client";
import { getExpenses } from "@/lib/actions/finance";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  return <ExpensesPageClient expenses={expenses} />;
}
