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
  AiAnalysisResult,
  AnalysisLevel,
  AnalysisPlanItem,
  HealthStatus,
} from "@/types/analysis";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
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
  isEmpty: boolean;
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

export function AnalyzePageClient({ isEmpty }: AnalyzePageClientProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка анализа");
        return;
      }

      setResult(data);
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
        description="Персональные рекомендации от финансового директора"
        action={
          <Button onClick={handleAnalyze} disabled={loading || isEmpty}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Анализ..." : "Запустить анализ"}
          </Button>
        }
      />

      {isEmpty && (
        <Card className="mb-6 border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Недостаточно данных</CardTitle>
            <CardDescription>
              Добавьте доходы, расходы или долги — тогда ИИ сможет провести
              анализ вашей финансовой ситуации.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-danger/30">
          <p className="text-red-400 text-sm p-5">{error}</p>
        </Card>
      )}

      {!result && !loading && !error && !isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle>Финансовый директор на базе ИИ</CardTitle>
            <CardDescription>
              Получите диагностику, утечки денег, оценку риска кассового разрыва
              и планы на 7, 30 и 90 дней
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
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
                {result.main_problem_label || "Главная угроза"}
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
                <CardTitle className="text-base">Риск кассового разрыва</CardTitle>
              </CardHeader>
              <div className="px-5 pb-5 space-y-2 text-sm">
                <Badge variant={levelVariants[result.cash_gap_risk.level]}>
                  {levelLabels[result.cash_gap_risk.level]}
                </Badge>
                <p className="leading-relaxed">{result.cash_gap_risk.description}</p>
                {result.cash_gap_risk.months_until_gap != null && (
                  <p className="text-muted">
                    Оценка до разрыва: {result.cash_gap_risk.months_until_gap} мес.
                  </p>
                )}
              </div>
            </Card>
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
        </div>
      )}
    </div>
  );
}
