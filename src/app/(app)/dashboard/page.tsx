import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";
import { DemoDataBanner } from "@/components/dashboard/demo-data-banner";
import { FinancialIndexGauge } from "@/components/dashboard/financial-index-gauge";
import { GoalFocusCard } from "@/components/dashboard/goal-focus-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { ProfileReadinessWidget } from "@/components/dashboard/profile-readiness-widget";
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
import { computeProfileReadiness } from "@/lib/profile/profile-readiness";
import { hasAnyProfileIncomeExpectation } from "@/types/profile-income";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import {
  getNextBestAction,
  getPrimaryGoalFocus,
  getTaskProgressStats,
} from "@/lib/actions/tasks";
import { computeDashboardSummary } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";
import { interpretForecast } from "@/lib/finance/forecast-interpretation";
import { getPrimaryFinancialRisk } from "@/lib/finance/primary-financial-risk";
import { shouldShowOnboardingChecklist } from "@/lib/onboarding/visibility";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await trackProductEvent(PRODUCT_EVENTS.DASHBOARD_OPENED, {}, user.id);
  }

  const [
    { incomes, expenses, debts, profileIncome },
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
    monthlyIncome,
    primaryIncome,
    additionalIncome,
    totalExpenses,
    debtPayments,
    netCashFlow,
    totalDebt,
    financialIndex,
  } = computeDashboardSummary(
    incomes,
    expenses,
    debts,
    profileType,
    profileIncome
  );

  const nbaOptions = { hasNegativeCashflow: netCashFlow < 0 };
  const [nextBestAction, taskProgress] = await Promise.all([
    getNextBestAction(nbaOptions),
    getTaskProgressStats(),
  ]);
  const forecast = forecastCashFlow(
    incomes,
    expenses,
    debts,
    3,
    profileType,
    profileIncome
  );
  const forecastInterpretation = interpretForecast({
    forecast: forecast.data,
    insufficientData: forecast.insufficientData,
    netCashFlow,
    monthlyIncome,
    totalDebt,
    debtPayments,
    goals,
    profileType,
    baseScenarioNet: forecast.data[0]?.net ?? null,
  });
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

  const profileReadiness = computeProfileReadiness({
    hasIncome:
      incomes.length > 0 || hasAnyProfileIncomeExpectation(profileIncome),
    hasExpenses: expenses.length > 0,
    hasGoal: goals.length > 0,
    hasAnalysis: onboarding?.analysis_done ?? false,
  });

  const showOnboardingChecklist =
    onboarding &&
    shouldShowOnboardingChecklist(onboarding.completed, user?.created_at);

  const primaryFinancialRisk =
    financialIndex !== null
        ? getPrimaryFinancialRisk(
          incomes,
          expenses,
          debts,
          goals,
          profileType,
          profileIncome
        )
      : null;

  return (
    <DashboardAutoRefresh>
      <div>
        <PageHeader
          title="Дашборд"
          description="Сводка по вашим деньгам"
        />

        <div className="space-y-4">
          {financialProfile.needsProfileSetup && <ProfileOnboardingCard />}
          {showOnboardingChecklist && (
            <OnboardingChecklist progress={onboarding} />
          )}

          <ProfileReadinessWidget readiness={profileReadiness} />

          <NextBestActionCard
            action={nextBestAction}
            taskProgress={taskProgress}
            hasNegativeCashflow={netCashFlow < 0}
          />

          <SummaryCards
            totalIncome={monthlyIncome}
            incomeSummary={{
              primaryIncome,
              additionalIncome,
              monthlyIncome,
            }}
            totalExpenses={totalExpenses}
            netCashFlow={netCashFlow}
            totalDebt={totalDebt}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] gap-4 items-stretch">
            <FinancialIndexGauge
              index={financialIndex}
              primaryRisk={primaryFinancialRisk}
            />
            <CashFlowChart
              data={forecast.data}
              insufficientData={forecast.insufficientData}
              basisLabel={forecast.basisLabel}
              scenarios={forecast.scenarios}
              interpretation={forecastInterpretation}
            />
          </div>

          <GoalFocusCard focus={goalFocus} />

          {profileStats && <ProfileDashboardStats stats={profileStats} />}

          <EarlyAccessBanner />

          <DemoDataBanner isEmpty={isEmpty} />
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
