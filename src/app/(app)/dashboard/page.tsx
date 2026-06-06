import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";
import { DemoDataBanner } from "@/components/dashboard/demo-data-banner";
import { FinancialIndexGauge } from "@/components/dashboard/financial-index-gauge";
import { GoalFocusCard } from "@/components/dashboard/goal-focus-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { EarlyAccessBanner } from "@/components/early-access/early-access-banner";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileDashboardStats } from "@/components/profile/profile-dashboard-stats";
import { ProfileOnboardingCard } from "@/components/profile/profile-onboarding-card";
import { getGoals } from "@/lib/actions/goals";
import { getFinancialData } from "@/lib/actions/finance";
import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { computeProfileDashboardStats } from "@/lib/profile/dashboard-stats";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import {
  getNextBestAction,
  getPrimaryGoalFocus,
  getTaskProgressStats,
} from "@/lib/actions/tasks";
import { computeDashboardSummary } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    { incomes, expenses, debts },
    goalFocus,
    onboarding,
    financialProfile,
    goals,
  ] = await Promise.all([
    getFinancialData(),
    getPrimaryGoalFocus(),
    getOnboardingProgress(),
    getUserFinancialProfile(),
    getGoals(),
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

  const nbaOptions = { hasNegativeCashflow: netCashFlow < 0 };
  const [nextBestAction, taskProgress] = await Promise.all([
    getNextBestAction(nbaOptions),
    getTaskProgressStats(),
  ]);
  const forecast = forecastCashFlow(incomes, expenses, debts);
  const isEmpty =
    incomes.length === 0 && expenses.length === 0 && debts.length === 0;

  const profileStats = !financialProfile.needsProfileSetup
    ? computeProfileDashboardStats(
        profileType,
        incomes,
        expenses,
        debts,
        goals
      )
    : null;

  const showOnboardingInProgress =
    onboarding && !onboarding.completed;
  const showOnboardingCompleted =
    onboarding && onboarding.completed;

  return (
    <DashboardAutoRefresh>
      <div>
        <PageHeader
          title="Дашборд"
          description="Сводка по вашим деньгам"
        />

        <div className="space-y-4">
          {financialProfile.needsProfileSetup && <ProfileOnboardingCard />}
          {showOnboardingInProgress && (
            <OnboardingChecklist progress={onboarding} />
          )}

          <NextBestActionCard
            action={nextBestAction}
            taskProgress={taskProgress}
            hasNegativeCashflow={netCashFlow < 0}
          />

          <SummaryCards
            totalIncome={totalIncome}
            expectedIncome={expectedIncome}
            incomeComparison={incomeComparison}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
            totalDebt={totalDebt}
          />

          <div className="max-w-sm">
            <FinancialIndexGauge index={financialIndex} />
          </div>

          <CashFlowChart
            data={forecast.data}
            insufficientData={forecast.insufficientData}
          />

          <GoalFocusCard focus={goalFocus} />

          {profileStats && <ProfileDashboardStats stats={profileStats} />}

          <EarlyAccessBanner />

          {showOnboardingCompleted && (
            <OnboardingChecklist progress={onboarding} />
          )}
          <DemoDataBanner isEmpty={isEmpty} />
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
