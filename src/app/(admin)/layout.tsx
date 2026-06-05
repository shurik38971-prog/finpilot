import { isAdminUser } from "@/lib/admin/is-admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!(await isAdminUser(supabase, user.email))) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold text-accent">
            FinPilot Admin
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link
              href="/admin"
              className="text-muted hover:text-foreground transition-colors"
            >
              Аналитика
            </Link>
            <Link
              href="/admin/insights"
              className="text-muted hover:text-foreground transition-colors"
            >
              Product Insights
            </Link>
          </nav>
          <span className="text-xs text-muted hidden sm:inline">
            {user.email}
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← В приложение
        </Link>
      </header>
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
