import { AdminUserWorkspace } from "@/components/admin/admin-user-workspace";
import { adminListEntityRecords } from "@/lib/actions/admin-crud";
import { adminGetUserDetail } from "@/lib/actions/admin-users";
import { ADMIN_ENTITY_SCHEMAS } from "@/lib/admin/entity-schemas";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let user;
  try {
    user = await adminGetUserDetail(userId);
  } catch {
    notFound();
  }

  const entityKeys = ADMIN_ENTITY_SCHEMAS.map((schema) => schema.key);
  const entries = await Promise.all(
    entityKeys.map(async (key) => {
      const records = await adminListEntityRecords(key, userId).catch(() => []);
      return [key, records] as const;
    })
  );

  const entityData = Object.fromEntries(entries);

  return <AdminUserWorkspace user={user} entityData={entityData} />;
}
