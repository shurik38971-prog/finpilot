import type { ProfileDashboardStatsData } from "@/lib/profile/dashboard-stats";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function ProfileDashboardStats({ stats }: { stats: ProfileDashboardStatsData }) {
  return (
    <Card className="border-border/70 bg-surface-hover/20 !p-4">
      <CardHeader className="mb-3 !px-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          Ваша статистика
        </CardTitle>
        <CardDescription className="text-xs">{stats.title}</CardDescription>
      </CardHeader>
      <div
        className={cn(
          "grid gap-3",
          stats.items.length === 1
            ? "grid-cols-1 max-w-xs"
            : stats.items.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
        )}
      >
        {stats.items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/60 bg-surface-hover/30 px-3 py-2.5"
          >
            <p className="text-[11px] text-muted leading-tight">{item.label}</p>
            <p className="text-sm font-semibold mt-1 tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
