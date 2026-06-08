import { EscapePlanPageClient } from "@/app/(app)/escape-plan/escape-plan-client";
import { getUserCapabilities } from "@/lib/actions/capabilities";
import { getDashboardSummary } from "@/lib/actions/finance";
import {
  getEscapePlanTasks,
  getPendingEscapeFollowUp,
  getUserEscapePlans,
} from "@/lib/actions/escape-plans";
import { buildRescuePlan } from "@/lib/escape-plan/build-rescue-plan";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import {
  getEffectiveSkills,
  resolvePrimaryGoal,
} from "@/types/escape-plan";
import { isActiveEscapeAttempt, resolveAttemptStatus } from "@/types/rescue-plan";

export const dynamic = "force-dynamic";

export default async function EscapePlanPage() {
  const [capabilities, escapePlans, pendingFollowUp, summary] = await Promise.all([
    getUserCapabilities(),
    getUserEscapePlans().catch(() => []),
    getPendingEscapeFollowUp().catch(() => null),
    getDashboardSummary().catch(() => null),
  ]);

  const activePlan = escapePlans.find((p) => isActiveEscapeAttempt(p)) ?? null;
  const activePlanTasks = activePlan
    ? await getEscapePlanTasks(activePlan.id).catch(() => [])
    : [];

  const financialSnapshot = {
    monthlyIncome: summary?.totalIncome ?? 0,
    netCashFlow: summary?.netCashFlow ?? 0,
    totalDebt: summary?.totalDebt ?? 0,
  };

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
      primaryGoal: resolvePrimaryGoal(capabilities),
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
    />
  );
}
