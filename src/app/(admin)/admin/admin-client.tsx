"use client";

import { getAdminAnalytics, type AdminAnalyticsDashboard } from "@/lib/actions/admin-analytics";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatHistoryDate } from "@/lib/utils";
import {
  BarChart3,
  HelpCircle,
  Loader2,
  MessageCircle,
  MousePointerClick,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

const FEEDBACK_LABELS: Record<string, string> = {
  question: "Вопрос",
  confusion: "Не понял",
  idea: "Идея",
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  idea: "💡 Идея",
  bug: "🐞 Проблема",
  confusion: "🤔 Непонятно",
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Просмотр страницы",
  first_click: "Первый клик",
  nav_click: "Меню",
  button_click: "Кнопка",
  analyze_started: "ИИ-анализ начат",
  analyze_completed: "ИИ-анализ готов",
  analyze_failed: "ИИ-анализ ошибка",
  task_completed: "Задача выполнена",
  help_opened: "Открыли «Почему важно»",
  demo_loaded: "Демо-данные",
  signup_completed: "Регистрация",
  login_completed: "Вход",
  feedback_sent: "Обратная связь",
};

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-accent/60" />
      </div>
    </Card>
  );
}

function RankList({
  title,
  items,
  valueKey = "count",
  labelKey = "label",
}: {
  title: string;
  items: Record<string, string | number>[];
  valueKey?: string;
  labelKey?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <ul className="px-5 pb-5 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted">Пока нет данных</li>
        ) : (
          items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 text-sm border-b border-border/40 pb-2 last:border-0"
            >
              <span className="truncate">{String(item[labelKey])}</span>
              <Badge variant="default">{String(item[valueKey])}</Badge>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

export function AdminDashboardClient({
  initialData,
}: {
  initialData: AdminAnalyticsDashboard;
}) {
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(30);
  const [pending, startTransition] = useTransition();

  function refresh(period: number) {
    setDays(period);
    startTransition(async () => {
      const next = await getAdminAnalytics(period);
      setData(next);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            Инсайты пользователей
          </h1>
          <p className="text-muted text-sm mt-1">
            Куда нажимают, что не понимают, что спрашивают — за {data.periodDays}{" "}
            дней
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Событий" value={data.totalEvents} icon={MousePointerClick} />
        <StatCard label="Пользователей" value={data.uniqueUsers} icon={Users} />
        <StatCard label="Сессий" value={data.uniqueSessions} icon={BarChart3} />
        <StatCard label="Обращений" value={data.feedback.length} icon={MessageCircle} />
      </div>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-base">Воронка</CardTitle>
          <CardDescription>Ключевые шаги за период</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 pb-5 text-center">
          {[
            { label: "Регистрации", value: data.funnel.signups },
            { label: "ИИ-анализы", value: data.funnel.analyzed },
            { label: "Задачи сделаны", value: data.funnel.tasksDone },
            { label: "Вопросы / жалобы", value: data.funnel.feedback },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg bg-surface-hover/50 p-4"
            >
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Product Insights</CardTitle>
          <CardDescription>
            Action Success Rate, опросы после анализа и реактивация
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <Link href="/admin/insights">
            <Button size="sm">Открыть Product Insights →</Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Сообщения обратной связи
            </CardTitle>
            <CardDescription>Страница «Обратная связь»</CardDescription>
          </CardHeader>
          <ul className="px-5 pb-5 space-y-3 max-h-96 overflow-y-auto">
            {data.productFeedback.recentMessages.length === 0 ? (
              <li className="text-sm text-muted">Пока нет сообщений</li>
            ) : (
              data.productFeedback.recentMessages.map((m) => (
                <li
                  key={m.id}
                  className="text-sm rounded-lg border border-border/50 p-3"
                >
                  <Badge variant="default" className="mb-2">
                    {MESSAGE_TYPE_LABELS[m.type] ?? m.type}
                  </Badge>
                  <p>{m.message}</p>
                  <p className="text-xs text-muted mt-2">
                    {formatHistoryDate(m.created_at.split("T")[0])}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList
          title="Куда нажимают первым"
          items={data.firstClicks}
        />
        <RankList
          title="С чего начинают сессию"
          items={data.entryPages.map((p) => ({
            label: p.path,
            count: p.count,
          }))}
        />
        <RankList
          title="Популярные страницы"
          items={data.topPages.map((p) => ({
            label: p.path,
            count: p.count,
          }))}
        />
        <RankList title="Клики по меню" items={data.topNavClicks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-400">
              <HelpCircle className="h-4 w-4" />
              Что не понимают
            </CardTitle>
            <CardDescription>
              Пользователи нажали «Не понял»
            </CardDescription>
          </CardHeader>
          <ul className="px-5 pb-5 space-y-3 max-h-80 overflow-y-auto">
            {data.confusions.length === 0 ? (
              <li className="text-sm text-muted">Пока нет записей</li>
            ) : (
              data.confusions.map((f) => (
                <li
                  key={f.id}
                  className="text-sm rounded-lg border border-border/50 p-3 bg-surface-hover/30"
                >
                  <p>{f.message}</p>
                  <p className="text-xs text-muted mt-2">
                    {f.page_path ?? "—"} ·{" "}
                    {formatHistoryDate(f.created_at.split("T")[0])}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-accent" />
              Вопросы и идеи
            </CardTitle>
          </CardHeader>
          <ul className="px-5 pb-5 space-y-3 max-h-80 overflow-y-auto">
            {data.feedback
              .filter((f) => f.feedback_type !== "confusion")
              .length === 0 ? (
              <li className="text-sm text-muted">Пока нет записей</li>
            ) : (
              data.feedback
                .filter((f) => f.feedback_type !== "confusion")
                .map((f) => (
                  <li
                    key={f.id}
                    className="text-sm rounded-lg border border-border/50 p-3"
                  >
                    <Badge variant="default" className="mb-2">
                      {FEEDBACK_LABELS[f.feedback_type] ?? f.feedback_type}
                    </Badge>
                    <p>{f.message}</p>
                    <p className="text-xs text-muted mt-2">
                      {f.page_path ?? "—"} ·{" "}
                      {formatHistoryDate(f.created_at.split("T")[0])}
                    </p>
                  </li>
                ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние события</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-muted border-b border-border">
                <th className="text-left py-2 font-medium">Когда</th>
                <th className="text-left py-2 font-medium">Событие</th>
                <th className="text-left py-2 font-medium">Страница</th>
                <th className="text-left py-2 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((e) => {
                const props = e.properties as { label?: string };
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border/40 text-muted"
                  >
                    <td className="py-2 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2">
                      {EVENT_LABELS[e.event_name] ?? e.event_name}
                    </td>
                    <td className="py-2">{e.page_path ?? "—"}</td>
                    <td className="py-2 truncate max-w-[200px]">
                      {props?.label || e.element_id || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-border/50 bg-surface-hover/20">
        <CardHeader>
          <CardTitle className="text-base">Настройка доступа</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            1. Добавьте email в <code className="text-accent">ADMIN_EMAILS</code>{" "}
            в <code>.env.local</code>
            <br />
            2. Миграции по порядку — см.{" "}
            <code className="text-accent">supabase/MIGRATIONS.md</code> (001…013)
            <br />
            3. В Supabase SQL:{" "}
            <code className="text-accent">
              insert into admin_users (email) values (&apos;ваш@email.com&apos;);
            </code>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
