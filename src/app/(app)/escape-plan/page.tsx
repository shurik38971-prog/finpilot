import { EscapePlanPageClient } from "@/app/(app)/escape-plan/escape-plan-client";
import { getUserCapabilities } from "@/lib/actions/capabilities";
import {
  getEscapePlanTasks,
  getPendingEscapeFollowUp,
  getUserEscapePlans,
} from "@/lib/actions/escape-plans";

export const dynamic = "force-dynamic";

export default async function EscapePlanPage() {
  const [capabilities, escapePlans, pendingFollowUp] = await Promise.all([
    getUserCapabilities(),
    getUserEscapePlans().catch(() => []),
    getPendingEscapeFollowUp().catch(() => null),
  ]);

  const activePlan = escapePlans.find((p) => p.status === "active");
  const activePlanTasks = activePlan
    ? await getEscapePlanTasks(activePlan.id).catch(() => [])
    : [];

  return (
    <EscapePlanPageClient
      initialCapabilities={capabilities}
      initialEscapePlans={escapePlans}
      initialPendingFollowUp={pendingFollowUp}
      initialActivePlanTasks={activePlanTasks}
    />
  );
}
