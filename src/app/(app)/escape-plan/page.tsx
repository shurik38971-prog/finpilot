import { EscapePlanPageClient } from "@/app/(app)/escape-plan/escape-plan-client";
import { getUserCapabilities } from "@/lib/actions/capabilities";
import {
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

  return (
    <EscapePlanPageClient
      initialCapabilities={capabilities}
      initialEscapePlans={escapePlans}
      initialPendingFollowUp={pendingFollowUp}
    />
  );
}
