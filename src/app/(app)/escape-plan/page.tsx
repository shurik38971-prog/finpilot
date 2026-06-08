import { EscapePlanPageClient } from "@/app/(app)/escape-plan/escape-plan-client";
import { getUserCapabilities } from "@/lib/actions/capabilities";

export const dynamic = "force-dynamic";

export default async function EscapePlanPage() {
  const capabilities = await getUserCapabilities();

  return <EscapePlanPageClient initialCapabilities={capabilities} />;
}
