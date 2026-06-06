import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";
import { DemoDataBanner } from "@/components/dashboard/demo-data-banner";
import { FinancialIndexGauge } from "@/components/dashboard/financial-index-gauge";
import { GoalFocusCard } from "@/components/dashboard/goal-focus-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { EarlyAccessBanner } from "@/components/early-access/early-access-banner";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { getFinancialData } from "@/lib/actions/finance";
import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { ProfileDashboardHints } from "@/components/profile/profile-dashboard-hints";
import { ProfileOnboardingCard } from "@/components/profile/profile-onboarding-card";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import { getNextBestAction, getPrimaryGoalFocus } from "@/lib/actions/tasks";
import { computeDashboardSummary } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ incomes, expenses, debts }, goalFocus, onboarding, financialProfile] =
    await Promise.all([
      getFinancialData(),
      getPrimaryGoalFocus(),
      getOnboardingProgress(),
      getUserFinancialProfile(),
    ]);

  const profileType =
    financialProfile.profileType ?? DEFAULT_PROFILE_TYPE;

  const {
    totalIncome,
    expectedIncome,
    incomeComparison,
    totalExpenses,
    netCashFlow,
    totalDebt,
    financialIndex,
  } = computeDashboardSummary(incomes, expenses, debts, profileType);

  const nextBestAction = await getNextBestAction({
    hasNegativeCashflow: netCashFlow < 0,
  });
  const forecast = forecastCashFlow(incomes, expenses, debts);
  const isEmpty =
    incomes.length === 0 && expenses.length === 0 && debts.length === 0;

  return (
    <DashboardAutoRefresh>
      <div>
        <PageHeader
          title="Дашборд"
          description="Сводка по вашим деньгам"
        />

        <div className="space-y-6">
          {financialProfile.needsProfileSetup && <ProfileOnboardingCard />}
          {onboarding && <OnboardingChecklist progress={onboarding} />}
          {!financialProfile.needsProfileSetup && (
            <ProfileDashboardHints profileType={profileType} />
          )}
          <EarlyAccessBanner />
          <DemoDataBanner isEmpty={isEmpty} />
          <NextBestActionCard action={nextBestAction} />
          <GoalFocusCard focus={goalFocus} />
          <SummaryCards
            totalIncome={totalIncome}
            expectedIncome={expectedIncome}
            incomeComparison={incomeComparison}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
            totalDebt={totalDebt}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FinancialIndexGauge index={financialIndex} />
            <div className="lg:col-span-2">
              <CashFlowChart
                data={forecast.data}
                insufficientData={forecast.insufficientData}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
