import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { CleanupActionsCard } from "@/components/dashboard/cleanup-actions-card";
import { EscapePlanLinkCard } from "@/components/dashboard/escape-plan-link-card";
import { DashboardAutoRefresh } from "@/components/dashboard/dashboard-auto-refresh";
import { DemoDataBanner } from "@/components/dashboard/demo-data-banner";
import { FinancialIndexGauge } from "@/components/dashboard/financial-index-gauge";
import { GoalFocusCard } from "@/components/dashboard/goal-focus-card";
import { MainProblemCard } from "@/components/dashboard/main-problem-card";
import { AnalysisDataSourceBadge } from "@/components/analysis/analysis-confidence-badge";
import { PreliminaryAnalysisBanner } from "@/components/analysis/preliminary-analysis-banner";
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
import {
  getCleanupActions,
  getNextBestAction,
  getPrimaryGoalFocus,
  getTaskProgressStats,
} from "@/lib/actions/tasks";
import { computeProfileDashboardStats } from "@/lib/profile/dashboard-stats";
import { computeProfileReadiness } from "@/lib/profile/profile-readiness";
import { hasAnyProfileIncomeExpectation } from "@/types/profile-income";
import { DEFAULT_PROFILE_TYPE } from "@/types/profile";
import { computeDashboardSummary } from "@/lib/finance/index";
import { forecastCashFlow } from "@/lib/finance/forecast";
import { interpretForecast } from "@/lib/finance/forecast-interpretation";
import { getPrimaryFinancialRisk } from "@/lib/finance/primary-financial-risk";
import { shouldShowOnboardingChecklist } from "@/lib/onboarding/visibility";
import { isCleanupMode } from "@/lib/feature-flags";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { getAnalysisDataMaturity } from "@/lib/actions/analyses";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cleanupMode = isCleanupMode();
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
  const [nextBestAction, taskProgress, analysisMaturity, cleanupActions] =
    await Promise.all([
      cleanupMode ? Promise.resolve(null) : getNextBestAction(nbaOptions),
      cleanupMode ? Promise.resolve({ completed: 0, total: 0, percent: 0 }) : getTaskProgressStats(),
      getAnalysisDataMaturity(),
      cleanupMode ? getCleanupActions(3) : Promise.resolve([]),
    ]);

  const forecast = cleanupMode
    ? null
    : forecastCashFlow(
        incomes,
        expenses,
        debts,
        3,
        profileType,
        profileIncome
      );

  const forecastInterpretation =
    forecast &&
    interpretForecast({
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

  const profileStats =
    !cleanupMode && !financialProfile.needsProfileSetup
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

  const showOnboardingChecklist = cleanupMode
    ? Boolean(onboarding && !onboarding.completed)
    : Boolean(
        onboarding &&
          shouldShowOnboardingChecklist(
            onboarding.completed,
            user?.created_at
          )
      );

  const primaryFinancialRisk = isEmpty
    ? null
    : getPrimaryFinancialRisk(
        incomes,
        expenses,
        debts,
        goals,
        profileType,
        profileIncome
      );

  return (
    <DashboardAutoRefresh>
      <div>
        <PageHeader
          title="Дашборд"
          description={
            cleanupMode ? undefined : "Сводка по вашим деньгам"
          }
        />

        <div className="space-y-4 max-w-xl mx-auto lg:max-w-2xl">
          {financialProfile.needsProfileSetup && <ProfileOnboardingCard />}
          {showOnboardingChecklist && (
            <OnboardingChecklist progress={onboarding!} />
          )}

          {!cleanupMode && (
            <ProfileReadinessWidget readiness={profileReadiness} />
          )}

          {analysisMaturity?.isPreliminary && (
            <>
              <PreliminaryAnalysisBanner compact={cleanupMode} />
              {!cleanupMode && (
                <AnalysisDataSourceBadge
                  dataSource={analysisMaturity.dataSource}
                />
              )}
            </>
          )}

          {cleanupMode ? (
            <>
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
                debtPayments={debtPayments}
                cleanupMode
              />
              <MainProblemCard problem={primaryFinancialRisk} />
              <CleanupActionsCard tasks={cleanupActions} />
              <EscapePlanLinkCard />
            </>
          ) : (
            <>
              <NextBestActionCard
                action={nextBestAction}
                taskProgress={taskProgress}
                hasNegativeCashflow={netCashFlow < 0}
                isPreliminary={analysisMaturity?.isPreliminary ?? false}
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

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] gap-4 items-stretch max-w-none">
                <FinancialIndexGauge
                  index={financialIndex}
                  primaryRisk={primaryFinancialRisk}
                />
                {forecast && (
                  <CashFlowChart
                    data={forecast.data}
                    insufficientData={forecast.insufficientData}
                    basisLabel={forecast.basisLabel}
                    scenarios={forecast.scenarios}
                    interpretation={forecastInterpretation}
                  />
                )}
              </div>

              <GoalFocusCard focus={goalFocus} />

              {profileStats && <ProfileDashboardStats stats={profileStats} />}

              <EarlyAccessBanner />
            </>
          )}

          <DemoDataBanner isEmpty={isEmpty} />
        </div>
      </div>
    </DashboardAutoRefresh>
  );
}
