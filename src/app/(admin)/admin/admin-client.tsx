"use client";

import { getAdminAnalytics, type AdminAnalyticsDashboard } from "@/lib/actions/admin-analytics";
import {
  getProductAnalytics,
  type ProductAnalyticsDashboard,
} from "@/lib/actions/product-analytics";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatHistoryDate } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  HelpCircle,
  LayoutDashboard,
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
  analyze_started: "Финансовый разбор начат",
  analyze_completed: "Финансовый разбор готов",
  analyze_failed: "Финансовый разбор ошибка",
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
  initialProductData,
}: {
  initialData: AdminAnalyticsDashboard;
  initialProductData: ProductAnalyticsDashboard;
}) {
  const [data, setData] = useState(initialData);
  const [productData, setProductData] = useState(initialProductData);
  const [days, setDays] = useState(30);
  const [pending, startTransition] = useTransition();

  function refresh(period: number) {
    setDays(period);
    startTransition(async () => {
      const [next, nextProduct] = await Promise.all([
        getAdminAnalytics(period),
        getProductAnalytics(period),
      ]);
      setData(next);
      setProductData(nextProduct);
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active users 24h"
          value={productData.activity.activeUsers24h}
          icon={Activity}
        />
        <StatCard
          label="Active users 7d"
          value={productData.activity.activeUsers7d}
          icon={Users}
        />
        <StatCard
          label="Dashboard opens 7d"
          value={productData.activity.dashboardOpens7d}
          icon={LayoutDashboard}
        />
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Activation Rate</CardTitle>
          <CardDescription>
            Доход + расход + анализ — за {productData.periodDays} дней
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <p className="text-2xl font-bold">
            Активировано: {productData.activation.activated} из{" "}
            {productData.activation.totalUsers} пользователей
          </p>
          <p className="text-sm text-muted mt-1">
            {productData.activation.ratePercent}% activation rate
          </p>
        </div>
      </Card>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="text-base">Воронка</CardTitle>
          <CardDescription>Уникальные пользователи за период</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-5 pb-5 text-center">
          {[
            { label: "Регистрации", value: productData.funnel.registrations },
            { label: "Добавили доход", value: productData.funnel.addedIncome },
            { label: "Добавили расход", value: productData.funnel.addedExpense },
            { label: "Запустили анализ", value: productData.funnel.startedAnalysis },
            { label: "Создали цель", value: productData.funnel.createdGoal },
            { label: "Выполнили задачу", value: productData.funnel.completedTask },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention</CardTitle>
            <CardDescription>Вернулись после регистрации</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 px-5 pb-5 text-center">
            {[
              { label: "Через 1 день", data: productData.retention.day1 },
              { label: "Через 7 дней", data: productData.retention.day7 },
              { label: "Через 30 дней", data: productData.retention.day30 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-surface-hover/50 p-4"
              >
                <p className="text-2xl font-bold">{item.data.percent}%</p>
                <p className="text-xs text-muted mt-1">
                  {item.label} ({item.data.count})
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Полезность продукта</CardTitle>
            <CardDescription>Сигналы ценности за период</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4 px-5 pb-5">
            {[
              {
                label: "Средняя оценка анализа",
                value:
                  productData.usefulness.avgAnalysisRating != null
                    ? `${productData.usefulness.avgAnalysisRating} / 5`
                    : "—",
              },
              {
                label: "Средняя оценка рекомендаций",
                value:
                  productData.usefulness.avgRecommendationRating != null
                    ? `${productData.usefulness.avgRecommendationRating} / 3`
                    : "—",
              },
              {
                label: "Выполненных задач",
                value: productData.usefulness.completedTasks,
              },
              {
                label: "Возвратов через 7 дней",
                value: productData.usefulness.returnedDay7,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-surface-hover/50 p-4"
              >
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs text-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Событий (legacy)" value={data.totalEvents} icon={MousePointerClick} />
        <StatCard label="Пользователей" value={data.uniqueUsers} icon={Users} />
        <StatCard label="Сессий" value={data.uniqueSessions} icon={BarChart3} />
        <StatCard label="Обращений" value={data.feedback.length} icon={MessageCircle} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Инсайты</CardTitle>
            <CardDescription>
              Воронка, рекомендации, цели и сводка для владельца продукта
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <Link href="/admin/insights">
              <Button size="sm">Открыть Инсайты →</Button>
            </Link>
          </div>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base">Управление данными</CardTitle>
            <CardDescription>
              Полное редактирование пользователей, отзывов и админов
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 flex flex-wrap gap-2">
            <Link href="/admin/users">
              <Button size="sm">Пользователи</Button>
            </Link>
            <Link href="/admin/feedback">
              <Button size="sm" variant="secondary">
                Отзывы
              </Button>
            </Link>
            <Link href="/admin/system">
              <Button size="sm" variant="secondary">
                Система
              </Button>
            </Link>
            <Link href="/admin/copy">
              <Button size="sm" variant="secondary">
                Тексты
              </Button>
            </Link>
          </div>
        </Card>
      </div>

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
