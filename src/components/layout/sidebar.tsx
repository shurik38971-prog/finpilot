"use client";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Compass,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  CircleHelp,
  History,
  MessageCircle,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useCopy } from "@/components/copy/site-copy-provider";
import { createClient } from "@/lib/supabase/client";
import { isNavHiddenInCleanup } from "@/lib/feature-flags";

const navItems = [
  { href: "/dashboard", copyKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/income", copyKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", copyKey: "nav.expenses", icon: TrendingDown },
  { href: "/debts", copyKey: "nav.debts", icon: CreditCard },
  { href: "/crisis", copyKey: "nav.crisis", icon: AlertTriangle },
  { href: "/escape-plan", copyKey: "nav.escape_plan", icon: Compass },
  { href: "/scenarios", copyKey: "nav.scenarios", icon: Zap },
  { href: "/simulator", copyKey: "nav.simulator", icon: FlaskConical },
  { href: "/actions", copyKey: "nav.actions", icon: CheckCircle2 },
  { href: "/analyze", copyKey: "nav.analyze", icon: Sparkles },
  { href: "/history", copyKey: "nav.history", icon: History },
  { href: "/goals", copyKey: "nav.goals", icon: Target },
  { href: "/feedback", copyKey: "nav.feedback", icon: MessageCircle },
  { href: "/faq", copyKey: "nav.faq", icon: CircleHelp },
  { href: "/settings", copyKey: "nav.settings", icon: Settings },
] as const;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  showAdminNav?: boolean;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navItemClassName(active: boolean) {
  return cn(
    "relative flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] font-medium leading-snug transition-colors md:text-sm",
    active
      ? "border-blue-500/35 bg-blue-500/15 text-white shadow-[inset_3px_0_0_0_#3b82f6]"
      : "border-transparent text-gray-200 md:hover:border-border/50 md:hover:bg-surface-hover md:hover:text-foreground"
  );
}

function navIconClassName(active: boolean) {
  return cn(
    "h-[18px] w-[18px] shrink-0 md:h-4 md:w-4",
    active ? "text-blue-400" : "text-gray-300"
  );
}

function SidebarNavItem({
  href,
  copyKey,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  href: string;
  copyKey: string;
  icon: typeof LayoutDashboard;
  pathname: string;
  onNavigate: (label: string, href: string) => void;
}) {
  const label = useCopy(copyKey);
  const active = isNavItemActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={() => onNavigate(label, href)}
      data-analytics-id={`nav-${href}`}
      data-analytics-label={label}
      aria-current={active ? "page" : undefined}
      className={navItemClassName(active)}
    >
      <Icon className={navIconClassName(active)} />
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  showAdminNav = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const adminNavLabel = useCopy("nav.admin", "Админка");
  const adminActive = pathname.startsWith("/admin");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNavClick(label: string, href: string) {
    trackClientEvent(ANALYTICS_EVENTS.NAV_CLICK, {
      element_id: href,
      properties: { label },
    });
    onMobileClose?.();
  }

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border md:px-6 md:py-5">
        <Logo variant="wordmark" href="/dashboard" iconSize={28} />
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-200 hover:bg-surface-hover hover:text-white"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {navItems
          .filter(({ href }) => !isNavHiddenInCleanup(href))
          .map((item) => (
            <SidebarNavItem
              key={item.href}
              {...item}
              pathname={pathname}
              onNavigate={handleNavClick}
            />
          ))}
        {showAdminNav && (
          <Link
            href="/admin"
            onClick={() => handleNavClick(adminNavLabel, "/admin")}
            data-analytics-id="nav-admin"
            aria-current={adminActive ? "page" : undefined}
            className={cn(
              navItemClassName(adminActive),
              "mt-2 border-dashed",
              !adminActive && "border-accent/20"
            )}
          >
            <BarChart3 className={navIconClassName(adminActive)} />
            <span className="min-w-0 break-words">{adminNavLabel}</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[15px] font-medium text-gray-200 transition-colors md:text-sm md:hover:border-border/50 md:hover:bg-surface-hover md:hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-300 md:h-4 md:w-4" />
          Выйти
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-border bg-surface">
        {content}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[min(18rem,88vw)] flex-col border-r border-border bg-surface transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        {content}
      </aside>
    </>
  );
}
