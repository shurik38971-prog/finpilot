import { AdminSystemClient } from "@/app/(admin)/admin/system/system-client";
import { adminListAdminEmails } from "@/lib/actions/admin-system";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const emails = await adminListAdminEmails();
  return <AdminSystemClient initialEmails={emails} />;
}
