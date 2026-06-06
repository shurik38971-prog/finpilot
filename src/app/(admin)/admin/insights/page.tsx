import { getOwnerInsights } from "@/lib/actions/owner-insights";
import { OwnerInsightsClient } from "./owner-insights-client";

export const dynamic = "force-dynamic";

export default async function ProductInsightsPage() {
  const data = await getOwnerInsights(30);
  return <OwnerInsightsClient initialData={data} />;
}
