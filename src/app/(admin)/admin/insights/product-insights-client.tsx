"use client";

import {
  getProductInsights,
  type ProductInsightsDashboard,
} from "@/lib/actions/product-insights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHistoryDate } from "@/lib/utils";
import {
  BarChart3,
  Loader2,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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

function QuoteList({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: { text: string; created_at: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <ul className="px-5 pb-5 space-y-3 max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <li className="text-sm text-muted">Пока нет данных</li>
        ) : (
          items.map((item, i) => (
            <li
              key={i}
              className="text-sm rounded-lg border border-border/50 p-3 bg-surface-hover/30"
            >
              <p>{item.text}</p>
              <p className="text-xs text-muted mt-2">
                {formatHistoryDate(item.created_at.split("T")[0])}
              </p>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

export function ProductInsightsClient({
  initialData,
}: {
  initialData: ProductInsightsDashboard;
}) {
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(90);
  const [pending, startTransition] = useTransition();

  function refresh(period: number) {
    setDays(period);
    startTransition(async () => {
      const next = await getProductInsights(period);
      setData(next);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-accent" />
            Product Insights
          </h1>
          <p className="text-muted text-sm mt-1">
            Меняет ли FinPilot финансовое поведение — за {data.periodDays} дней
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {[30, 90, 180].map((d) => (
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Action Success Rate
          </CardTitle>
          <CardDescription>
            Доля пользователей, которые после анализа сделали действие
          </CardDescription>
        </CardHeader>
        <div className="px-5 pb-6">
          <p className="text-5xl font-bold tracking-tight text-accent">
            {data.actionSuccessRate != null ? `${data.actionSuccessRate}%` : "—"}
          </p>
          <p className="text-sm text-muted mt-2">
            {data.usersWhoTookAction} из {data.feedbackCount} прошедших опрос
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Пользователей" value={data.totalUsers} icon={Users} />
        <StatCard label="Анализов" value={data.totalAnalyses} icon={BarChart3} />
        <StatCard
          label="С обратной связью"
          value={data.feedbackCount}
          icon={MessageSquare}
        />
        <StatCard
          label="Сделали действие"
          value={data.usersWhoTookAction}
          icon={TrendingUp}
          highlight
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Реактивация (7 дней)</CardTitle>
          <CardDescription>Email «Удалось ли выполнить действие?»</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-5 pb-5 text-center">
          {[
            { label: "Отправлено", value: data.reactivationCampaigns.sent },
            { label: "Открыто", value: data.reactivationCampaigns.opened },
            { label: "Ответили", value: data.reactivationCampaigns.completed },
            { label: "Да", value: data.reactivationCampaigns.yesCount },
            { label: "Нет", value: data.reactivationCampaigns.noCount },
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
            <CardTitle className="text-base">Самые полезные функции</CardTitle>
          </CardHeader>
          <ul className="px-5 pb-5 space-y-2">
            {data.popularFeatures.length === 0 ? (
              <li className="text-sm text-muted">Пока нет данных</li>
            ) : (
              data.popularFeatures.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-2 text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <span>{item.label}</span>
                  <Badge variant="default">{item.count}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>

        <QuoteList
          title="Что сделали после анализа"
          description="Ответы «Да» на вопрос о действии"
          items={data.actionDescriptions}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuoteList
          title="Частые проблемы"
          description="Что было непонятно"
          items={data.commonConfusions}
        />
        <QuoteList
          title="Запросы новых функций"
          items={data.commonFeatureRequests}
        />
      </div>

      <QuoteList
        title="Что потеряли бы без FinPilot"
        items={data.lostValueQuotes}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние опросы</CardTitle>
        </CardHeader>
        <ul className="px-5 pb-5 space-y-3 max-h-96 overflow-y-auto">
          {data.recentSurveys.length === 0 ? (
            <li className="text-sm text-muted">Пока нет ответов</li>
          ) : (
            data.recentSurveys.map((s) => (
              <li
                key={s.id}
                className="text-sm rounded-lg border border-border/50 p-3 bg-surface-hover/30"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  {s.most_useful_feature && (
                    <Badge variant="default">{s.most_useful_feature}</Badge>
                  )}
                  <Badge variant={s.took_action ? "success" : "warning"}>
                    {s.took_action ? "Сделал действие" : "Не сделал"}
                  </Badge>
                </div>
                {s.action_description && (
                  <p className="text-xs text-muted mb-1">
                    Действие: {s.action_description}
                  </p>
                )}
                {s.confusion_text && (
                  <p>Непонятно: {s.confusion_text}</p>
                )}
                {s.missing_feature && (
                  <p className="mt-1">Не хватает: {s.missing_feature}</p>
                )}
                {s.lost_value_text && (
                  <p className="mt-1 text-muted">
                    Потеря: {s.lost_value_text}
                  </p>
                )}
                <p className="text-xs text-muted mt-2">
                  {formatHistoryDate(s.created_at.split("T")[0])}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
