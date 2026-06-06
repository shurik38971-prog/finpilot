import { getAdminAnalytics } from "@/lib/actions/admin-analytics";
import { getProductAnalytics } from "@/lib/actions/product-analytics";
import { AdminDashboardClient } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [data, productData] = await Promise.all([
    getAdminAnalytics(30),
    getProductAnalytics(30),
  ]);
  return (
    <AdminDashboardClient initialData={data} initialProductData={productData} />
  );
}
