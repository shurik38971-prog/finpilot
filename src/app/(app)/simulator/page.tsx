import { getFinancialData } from "@/lib/actions/finance";
import { getGoals } from "@/lib/actions/goals";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import { SimulatorPageClient } from "./simulator-client";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const [{ incomes, expenses, debts, profileIncome }, goals, financialProfile] =
    await Promise.all([
      getFinancialData(),
      getGoals(),
      getUserFinancialProfile(),
    ]);

  return (
    <SimulatorPageClient
      incomes={incomes}
      expenses={expenses}
      debts={debts}
      goals={goals}
      profileType={financialProfile.profileType ?? DEFAULT_PROFILE_TYPE}
      profileIncome={profileIncome}
    />
  );
}
