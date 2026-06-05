import { getDebts } from "@/lib/actions/finance";
import { getGoals } from "@/lib/actions/goals";
import { GoalsPageClient } from "./goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const [goals, debts] = await Promise.all([getGoals(), getDebts()]);

  return <GoalsPageClient goals={goals} debts={debts} />;
}
