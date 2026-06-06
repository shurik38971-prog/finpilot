import { getFinancialData } from "@/lib/actions/finance";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import { ScenariosPageClient } from "./scenarios-client";

export default async function ScenariosPage() {
  const [data, profile] = await Promise.all([
    getFinancialData(),
    getUserFinancialProfile(),
  ]);

  return (
    <ScenariosPageClient
      incomes={data.incomes}
      expenses={data.expenses}
      debts={data.debts}
      profileIncome={data.profileIncome}
      profileType={profile.profileType ?? DEFAULT_PROFILE_TYPE}
    />
  );
}
