"use client";

import {
  getOwnerInsights,
  type OwnerInsightsDashboard,
} from "@/lib/actions/owner-insights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  Target,
  ThumbsUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-accent/40 bg-accent/5" : undefined}>
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon
          className={`h-8 w-8 ${highlight ? "text-accent" : "text-accent/60"}`}
        />
      </div>
    </Card>
  );
}

function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RankList({
  title,
  description,
  items,
  valueSuffix = "",
  emptyText = "Пока нет данных",
}: {
  title: string;
  description?: string;
  items: { label: string; count: number; extra?: string }[];
  valueSuffix?: string;
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <ul className="px-5 pb-5 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted">{emptyText}</li>
        ) : (
          items.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-2 text-sm border-b border-border/40 pb-2 last:border-0"
            >
              <span className="truncate">
                {item.label}
                {item.extra ? (
                  <span className="text-muted"> · {item.extra}</span>
                ) : null}
              </span>
              <Badge variant="default">
                {item.count}
                {valueSuffix}
              </Badge>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

export function OwnerInsightsClient({
  initialData,
}: {
  initialData: OwnerInsightsDashboard;
}) {
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(30);
  const [pending, startTransition] = useTransition();

  function refresh(period: number) {
    setDays(period);
    startTransition(async () => {
      const next = await getOwnerInsights(period);
      setData(next);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-accent" />
            Инсайты
          </h1>
          <p className="text-muted text-sm mt-1">
            Что происходит с пользователями — за {data.periodDays} дней
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "primary" : "secondary"}
              onClick={() => refresh(d)}
              disabled={pending}
            >
              {d} дн
            </Button>
          ))}
          {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        </div>
      </div>

      <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">Сводка для владельца продукта</CardTitle>
          <CardDescription>Автоматически за последние 7 дней</CardDescription>
        </CardHeader>
        <p className="px-5 pb-6 text-sm leading-relaxed">{data.ownerSummary}</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Всего пользователей"
          value={data.overview.totalUsers}
          icon={Users}
        />
        <StatCard
          label="Новых за 7 дней"
          value={data.overview.newUsers7d}
          icon={BarChart3}
        />
        <StatCard
          label="Активированных"
          value={data.overview.activatedUsers}
          icon={Target}
          highlight
        />
        <StatCard
          label="Activation Rate"
          value={`${data.overview.activationRatePercent}%`}
          icon={ThumbsUp}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active users 24h"
          value={data.activity.activeUsers24h}
          icon={Activity}
          highlight
        />
        <StatCard
          label="Active users 7d"
          value={data.activity.activeUsers7d}
          icon={Users}
          highlight
        />
        <StatCard
          label="Dashboard opens 7d"
          value={data.activity.dashboardOpens7d}
          icon={LayoutDashboard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Пользователи</CardTitle>
          <CardDescription>
            Новые — зарегистрировались за 7 дней. Активные — были события за 7
            дней. Вернувшийся старый пользователь попадает только в активные.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border/50">
                <th className="pb-2 pr-4 font-medium">Пользователь</th>
                <th className="pb-2 pr-4 font-medium">Регистрация</th>
                <th className="pb-2 pr-4 font-medium">Последняя активность</th>
                <th className="pb-2 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    Пока нет пользователей
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <tr
                    key={user.userId}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/users/${user.userId}`}
                        className="font-medium truncate max-w-[220px] block hover:text-accent"
                      >
                        {user.email ?? `${user.userId.slice(0, 8)}…`}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-muted whitespace-nowrap">
                      {formatAdminDate(user.registeredAt)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatAdminDate(user.lastActivityAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.isNew7d && (
                          <Badge variant="default">Новый</Badge>
                        )}
                        {user.isActive7d && (
                          <Badge variant="success">Активный</Badge>
                        )}
                        {!user.isNew7d && !user.isActive7d && (
                          <span className="text-xs text-muted">Неактивный</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList
          title="Самые популярные действия"
          description="Топ рекомендаций по выполнениям"
          items={data.topRecommendations.map((item) => ({
            label: item.title,
            count: item.count,
          }))}
          valueSuffix=" выполн."
        />

        <RankList
          title="Самые бесполезные рекомендации"
          description="Низкие оценки полезности"
          items={data.lowRatedRecommendations.map((item) => ({
            label: item.title,
            count: item.count,
            extra: `ср. ${item.avgScore}/3`,
          }))}
          emptyText="Пока нет негативных оценок"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList
          title="Причины низких оценок"
          items={data.lowRatingReasons.map((item) => ({
            label: item.label,
            count: item.count,
          }))}
          emptyText="Причины появятся после ответов «Нет» или «Немного»"
        />

        <RankList
          title="Что чаще всего анализируют"
          description="Топ целей пользователей"
          items={data.topGoals.map((item) => ({
            label: item.label,
            count: item.count,
          }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Проблемные места в воронке
          </CardTitle>
          <CardDescription>
            Конверсия между шагами за {data.periodDays} дней
          </CardDescription>
        </CardHeader>
        <ul className="px-5 pb-5 space-y-3">
          {data.funnelSteps.length === 0 ? (
            <li className="text-sm text-muted">Пока нет данных</li>
          ) : (
            data.funnelSteps.map((step) => {
              const isWorst =
                data.biggestFunnelDrop?.label === step.label &&
                step.dropPercent > 0;

              return (
                <li
                  key={step.label}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    isWorst
                      ? "border-orange-400/40 bg-orange-400/10"
                      : "border-border/50 bg-surface-hover/20"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{step.label}</span>
                    {isWorst && (
                      <Badge variant="warning">Самый большой провал</Badge>
                    )}
                  </div>
                  <p className="text-muted mt-1 text-xs">
                    {step.fromCount} → {step.toCount} · конверсия{" "}
                    {step.conversionPercent}% · отвал {step.dropPercent}%
                  </p>
                </li>
              );
            })
          )}
        </ul>
      </Card>
    </div>
  );
}
