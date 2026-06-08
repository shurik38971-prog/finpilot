import { AppShell } from "@/components/layout/app-shell";
import { canShowAdminNav } from "@/lib/admin/is-admin";
import { getResolvedSiteCopy } from "@/lib/copy/resolve-site-copy";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const siteCopy = await getResolvedSiteCopy();

  return (
    <AppShell showAdminNav={canShowAdminNav(user?.email)} siteCopy={siteCopy}>
      {children}
    </AppShell>
  );
}
