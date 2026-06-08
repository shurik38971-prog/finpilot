import { isAdminUser } from "@/lib/admin/is-admin";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireAdmin(): Promise<{
  user: User;
  service: ReturnType<typeof createServiceClient>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await isAdminUser(supabase, user.email))) {
    throw new Error("Forbidden");
  }

  return { user, service: createServiceClient() };
}
