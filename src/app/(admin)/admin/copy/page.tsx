import { SiteCopyAdminClient } from "@/app/(admin)/admin/copy/site-copy-admin-client";
import { adminGetSiteCopyEditorData } from "@/lib/actions/admin-site-copy";

export const dynamic = "force-dynamic";

export default async function AdminSiteCopyPage() {
  const items = await adminGetSiteCopyEditorData();
  return <SiteCopyAdminClient initialItems={items} />;
}
