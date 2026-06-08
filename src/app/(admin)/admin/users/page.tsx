import { AdminUsersClient } from "@/app/(admin)/admin/users/users-client";
import { adminListUsers } from "@/lib/actions/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await adminListUsers();
  return <AdminUsersClient initialUsers={users} />;
}
