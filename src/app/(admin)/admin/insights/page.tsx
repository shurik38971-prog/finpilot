import { getProductInsights } from "@/lib/actions/product-insights";
import { ProductInsightsClient } from "./product-insights-client";

export const dynamic = "force-dynamic";

export default async function ProductInsightsPage() {
  const data = await getProductInsights(90);
  return <ProductInsightsClient initialData={data} />;
}
