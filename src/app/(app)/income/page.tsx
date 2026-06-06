import { IncomePageClient } from "./income-client";
import { getIncomes } from "@/lib/actions/finance";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { DEFAULT_PROFILE_TYPE, usesVariableIncome } from "@/types/profile";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const [incomes, profile] = await Promise.all([
    getIncomes(),
    getUserFinancialProfile(),
  ]);

  const profileType = profile.profileType ?? DEFAULT_PROFILE_TYPE;

  return (
    <IncomePageClient
      incomes={incomes}
      showIncomeExpectationsHint={usesVariableIncome(profileType)}
    />
  );
}
