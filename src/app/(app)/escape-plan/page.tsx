import { EscapePlanPageClient } from "@/app/(app)/escape-plan/escape-plan-client";
import { getUserCapabilities } from "@/lib/actions/capabilities";
import { getDashboardSummary } from "@/lib/actions/finance";
import { getGoals } from "@/lib/actions/goals";
import {
  getEscapePlanTasks,
  getPendingEscapeFollowUp,
  getUserEscapePlans,
  syncActiveEscapeRouteSteps,
  syncFinancialMeasureTasks,
} from "@/lib/actions/escape-plans";
import { getFinancialMeasureTasks } from "@/lib/actions/tasks";
import { buildRescuePlan } from "@/lib/escape-plan/build-rescue-plan";
import { formatMainFinancialGoal } from "@/lib/escape-plan/format-financial-goal";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import {
  getEffectiveSkills,
} from "@/types/escape-plan";
import { isActiveEscapeAttempt, resolveAttemptStatus } from "@/types/rescue-plan";

export const dynamic = "force-dynamic";

export default async function EscapePlanPage() {
  const [capabilities, escapePlans, pendingFollowUp, summary, goals] =
    await Promise.all([
    getUserCapabilities(),
    getUserEscapePlans().catch(() => []),
    getPendingEscapeFollowUp().catch(() => null),
    getDashboardSummary().catch(() => null),
    getGoals().catch(() => []),
  ]);

  const activePlan = escapePlans.find((p) => isActiveEscapeAttempt(p)) ?? null;

  if (activePlan) {
    try {
      await syncActiveEscapeRouteSteps();
    } catch (error) {
      console.error("Failed to ensure active route steps:", error);
    }
  }

  const activePlanTasks = activePlan
    ? await getEscapePlanTasks(activePlan.id).catch(() => [])
    : [];

  if (capabilities?.last_plan?.options?.length) {
    try {
      await syncFinancialMeasureTasks(capabilities.last_plan.options);
    } catch (error) {
      console.error("Failed to sync financial measure tasks:", error);
    }
  }

  const financialMeasureTasks = await getFinancialMeasureTasks().catch(() => []);

  const financialSnapshot = {
    monthlyIncome: summary?.totalIncome ?? 0,
    netCashFlow: summary?.netCashFlow ?? 0,
    totalDebt: summary?.totalDebt ?? 0,
  };
  const mainFinancialGoal = formatMainFinancialGoal(
    goals,
    capabilities,
    financialSnapshot.totalDebt
  );

  let initialRescuePlan = capabilities?.last_rescue_plan ?? null;

  if (capabilities?.last_plan && summary) {
    const failedPlans = escapePlans.filter(
      (item) =>
        resolveAttemptStatus(item) === "failed" && Boolean(item.failure_reason)
    );
    const ranked =
      getEffectiveSkills(capabilities).length > 0
        ? rankAndSortEscapePlanOptions(
            capabilities.last_plan.options,
            buildEscapeRankingContext(capabilities, failedPlans)
          )
        : capabilities.last_plan.options;

    initialRescuePlan = buildRescuePlan({
      ...financialSnapshot,
      primaryGoal: mainFinancialGoal,
      escapePlan: capabilities.last_plan,
      topOption: ranked[0] ?? null,
      activePlan,
      pendingTasks: activePlanTasks,
    });
  }

  return (
    <EscapePlanPageClient
      initialCapabilities={capabilities}
      financialSnapshot={financialSnapshot}
      initialRescuePlan={initialRescuePlan}
      initialEscapePlans={escapePlans}
      initialPendingFollowUp={pendingFollowUp}
      initialActivePlanTasks={activePlanTasks}
      initialFinancialMeasureTasks={financialMeasureTasks}
      hasActiveRoute={Boolean(activePlan)}
      mainFinancialGoal={mainFinancialGoal}
      onboardingGoals={goals}
    />
  );
}
