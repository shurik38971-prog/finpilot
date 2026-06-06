"use client";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  AnalysisApiResponse,
  AnalysisLevel,
  AnalysisPlanItem,
  HealthStatus,
} from "@/types/analysis";
import { AnalysisDataSourceBadge } from "@/components/analysis/analysis-confidence-badge";
import { PreliminaryAnalysisBanner } from "@/components/analysis/preliminary-analysis-banner";
import { AnalysisDisclaimer } from "@/components/early-access/analysis-disclaimer";
import { EmptyState } from "@/components/ui/empty-state";
import { trackButtonClick } from "@/lib/analytics/client";
import { markAnalysisCompleted } from "@/lib/feedback/post-analysis-engagement";
import { COPY } from "@/lib/copy/ui";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const levelLabels: Record<AnalysisLevel, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const levelVariants: Record<AnalysisLevel, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

const healthLabels: Record<HealthStatus, string> = {
  good: "Стабильно",
  bad: "Плохо",
  critical: "Критично",
};

const healthVariants: Record<HealthStatus, "success" | "warning" | "danger"> = {
  good: "success",
  bad: "warning",
  critical: "danger",
};

interface AnalyzePageClientProps {
  canAnalyze: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
}

function PlanList({
  title,
  items,
  accent,
}: {
  title: string;
  items: AnalysisPlanItem[];
  accent: string;
}) {
  if (!items?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-base ${accent}`}>{title}</CardTitle>
      </CardHeader>
      <ul className="px-5 pb-5 space-y-4">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium">{item.action}</p>
            <p className="text-muted leading-relaxed mt-1">{item.why}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function AnalyzePageClient({
  canAnalyze,
  hasIncome,
  hasExpense,
}: AnalyzePageClientProps) {
  const fillDataHref = !hasIncome ? "/income" : "/expenses";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisApiResponse | null>(null);
  const [createdTasksCount, setCreatedTasksCount] = useState<number | null>(null);
  const [updatedTasksCount, setUpdatedTasksCount] = useState<number | null>(null);
  const [skippedDuplicateTasksCount, setSkippedDuplicateTasksCount] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    setCreatedTasksCount(null);
    setUpdatedTasksCount(null);
    setSkippedDuplicateTasksCount(null);

    trackButtonClick("analyze-run", "Запустить ИИ-анализ");

    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка анализа");
        return;
      }

      const {
        created_tasks_count,
        updated_tasks_count,
        skipped_duplicate_tasks_count,
        tasks_created,
        ...analysis
      } = data as AnalysisApiResponse & { tasks_created?: number };
      setResult(analysis);
      setCreatedTasksCount(created_tasks_count ?? tasks_created ?? 0);
      setUpdatedTasksCount(updated_tasks_count ?? 0);
      setSkippedDuplicateTasksCount(skipped_duplicate_tasks_count ?? 0);
      markAnalysisCompleted();
    } catch {
      setError("Не удалось выполнить анализ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="ИИ-анализ"
        description="Персональный разбор ваших денег и что делать дальше"
        action={
          <Button onClick={handleAnalyze} disabled={loading || !canAnalyze}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Анализ..." : "Запустить анализ"}
          </Button>
        }
      />

      {!canAnalyze && (
        <EmptyState
          icon={Sparkles}
          title="Недостаточно данных для анализа"
          description="Добавьте базовые финансовые данные — после этого FinPilot сможет провести персональный разбор."
          actionLabel="Заполнить данные"
          actionHref={fillDataHref}
          requirements={[
            { label: "1 доход", done: hasIncome },
            { label: "1 расход", done: hasExpense },
          ]}
          className="mb-6"
        />
      )}

      {error && (
        <Card className="mb-6 border-danger/30">
          <p className="text-red-400 text-sm p-5">{error}</p>
        </Card>
      )}

      {!result && !loading && !error && canAnalyze && (
        <Card>
          <CardHeader>
            <CardTitle>Разбор от ИИ</CardTitle>
            <CardDescription>
              Узнайте, куда уходят деньги, хватит ли до следующего дохода и что
              сделать на 7, 30 и 90 дней
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {result.analysis_mode === "preliminary" && (
            <PreliminaryAnalysisBanner />
          )}

          {result.data_source && (
            <AnalysisDataSourceBadge dataSource={result.data_source} />
          )}

          {result.next_best_action?.title && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {result.next_step_label ?? "Следующий шаг"}
                </CardTitle>
                <CardDescription className="text-sm text-foreground">
                  {result.next_best_action.title}
                </CardDescription>
              </CardHeader>
              {result.next_best_action.description && (
                <p className="px-5 pb-5 text-sm text-muted leading-relaxed">
                  {result.next_best_action.description}
                </p>
              )}
            </Card>
          )}

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {createdTasksCount !== null &&
                updatedTasksCount !== null &&
                (createdTasksCount > 0 || updatedTasksCount > 0)
                  ? `Анализ готов. Обновили существующие задачи: ${updatedTasksCount}. Новых задач: ${createdTasksCount}.`
                  : createdTasksCount === 0 &&
                      updatedTasksCount === 0 &&
                      skippedDuplicateTasksCount !== null &&
                      skippedDuplicateTasksCount > 0
                    ? "Анализ готов. Новых задач нет — похожие рекомендации уже есть в действиях."
                    : "Анализ готов"}
              </CardTitle>
              <CardDescription>
                {createdTasksCount !== null && createdTasksCount > 0
                  ? "Новые дела добавлены в список «Что делать»."
                  : updatedTasksCount !== null && updatedTasksCount > 0
                    ? "Актуальные рекомендации обновлены в существующих задачах."
                    : skippedDuplicateTasksCount !== null &&
                        skippedDuplicateTasksCount > 0
                      ? `Пропущено дублей: ${skippedDuplicateTasksCount}.`
                      : "Рекомендации сохранены в отчёте анализа."}
              </CardDescription>
            </CardHeader>
            <div className="px-5 pb-5">
              <Link
                href="/actions"
                className="text-sm text-accent hover:underline"
              >
                Перейти к действиям →
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Диагностика</CardTitle>
                {result.health_status && (
                  <Badge variant={healthVariants[result.health_status]}>
                    {healthLabels[result.health_status]}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <div className="px-5 pb-5 space-y-3 text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">{result.summary}</p>
              {result.health_explanation && (
                <p className="text-muted">{result.health_explanation}</p>
              )}
            </div>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                {result.analysis_mode === "preliminary"
                  ? "На что обратить внимание"
                  : result.main_problem_label || "Главная угроза"}
              </CardTitle>
            </CardHeader>
            <p className="px-5 pb-5 text-sm leading-relaxed">
              {result.main_threat}
            </p>
          </Card>

          {result.money_leaks?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-400">
                  Утечки денег
                </CardTitle>
              </CardHeader>
              <ul className="px-5 pb-5 space-y-2 text-sm">
                {result.money_leaks.map((leak, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-400 shrink-0">•</span>
                    {leak}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.cash_gap_risk && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Риск: не хватит денег до следующего дохода
                </CardTitle>
              </CardHeader>
              <div className="px-5 pb-5 space-y-2 text-sm">
                <Badge variant={levelVariants[result.cash_gap_risk.level]}>
                  {levelLabels[result.cash_gap_risk.level]}
                </Badge>
                <p className="leading-relaxed">{result.cash_gap_risk.description}</p>
                {result.cash_gap_risk.months_until_gap != null && (
                  <p className="text-muted">
                    Примерно через: {result.cash_gap_risk.months_until_gap} мес.
                  </p>
                )}
              </div>
            </Card>
          )}

          {(result.debt_recommendation || result.cashflow_forecast_comment) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {result.debt_recommendation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Долги</CardTitle>
                  </CardHeader>
                  <p className="px-5 pb-5 text-sm leading-relaxed">
                    {result.debt_recommendation}
                  </p>
                </Card>
              )}
              {result.cashflow_forecast_comment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{COPY.leftPerMonth}</CardTitle>
                  </CardHeader>
                  <p className="px-5 pb-5 text-sm leading-relaxed">
                    {result.cashflow_forecast_comment}
                  </p>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <PlanList
              title="План на 7 дней"
              items={result.plan_7_days}
              accent="text-orange-400"
            />
            <PlanList
              title="План на 30 дней"
              items={result.plan_30_days}
              accent="text-emerald-400"
            />
            <PlanList
              title="План на 90 дней"
              items={result.plan_90_days}
              accent="text-accent"
            />
          </div>

          <AnalysisDisclaimer />
        </div>
      )}
    </div>
  );
}
