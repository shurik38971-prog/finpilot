"use client";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
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
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/income", label: "Доходы", icon: TrendingUp },
  { href: "/expenses", label: "Расходы", icon: TrendingDown },
  { href: "/debts", label: "Долги", icon: CreditCard },
  { href: "/crisis", label: "Антикризис", icon: AlertTriangle },
  { href: "/scenarios", label: "Сценарии", icon: Zap },
  { href: "/simulator", label: "Что если", icon: FlaskConical },
  { href: "/actions", label: "Что делать", icon: CheckCircle2 },
  { href: "/analyze", label: "ИИ-анализ", icon: Sparkles },
  { href: "/history", label: "История", icon: History },
  { href: "/goals", label: "Цели", icon: Target },
  { href: "/feedback", label: "Обратная связь", icon: MessageCircle },
  { href: "/faq", label: "FAQ", icon: CircleHelp },
  { href: "/settings", label: "Настройки", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isAdmin?: boolean;
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Logo variant="wordmark" href="/dashboard" iconSize={28} />
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => handleNavClick(label, href)}
            data-analytics-id={`nav-${href}`}
            data-analytics-label={label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname === href
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => handleNavClick("Админка", "/admin")}
            data-analytics-id="nav-admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mt-2 border border-dashed border-accent/30",
              pathname.startsWith("/admin")
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            Админка
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col border-r border-border bg-surface">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
