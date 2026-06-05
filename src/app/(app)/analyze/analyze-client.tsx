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
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

type Level = "high" | "medium" | "low";

interface AnalysisRisk {
  level: Level;
  title: string;
  description: string;
}

interface AnalysisAction {
  priority: Level;
  action: string;
  effect: string;
}

interface AnalysisResult {
  summary: string;
  main_problem: string;
  risks: AnalysisRisk[];
  actions_30_days: AnalysisAction[];
  debt_recommendation: string;
  cashflow_forecast_comment: string;
}

const levelLabels: Record<Level, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const levelVariants: Record<Level, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

interface AnalyzePageClientProps {
  isEmpty: boolean;
}

export function AnalyzePageClient({ isEmpty }: AnalyzePageClientProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
              Нажмите «Запустить анализ», чтобы получить диагностику, риски,
              план на 30 дней и рекомендации по долгам и денежному потоку
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Диагностика</CardTitle>
            </CardHeader>
            <p className="px-5 pb-5 text-sm leading-relaxed whitespace-pre-wrap">
              {result.summary}
            </p>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                Главная проблема
              </CardTitle>
            </CardHeader>
            <p className="px-5 pb-5 text-sm leading-relaxed">
              {result.main_problem}
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-400">Риски</CardTitle>
            </CardHeader>
            <ul className="px-5 pb-5 space-y-4">
              {result.risks?.map((risk, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={levelVariants[risk.level] ?? "default"}>
                      {levelLabels[risk.level] ?? risk.level}
                    </Badge>
                    <span className="font-medium">{risk.title}</span>
                  </div>
                  <p className="text-muted leading-relaxed">{risk.description}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-emerald-400">
                План на 30 дней
              </CardTitle>
            </CardHeader>
            <ul className="px-5 pb-5 space-y-4">
              {result.actions_30_days?.map((item, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={levelVariants[item.priority] ?? "default"}>
                      {levelLabels[item.priority] ?? item.priority}
                    </Badge>
                    <span className="font-medium">{item.action}</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    Эффект: {item.effect}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Долги</CardTitle>
              </CardHeader>
              <p className="px-5 pb-5 text-sm leading-relaxed">
                {result.debt_recommendation}
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Денежный поток</CardTitle>
              </CardHeader>
              <p className="px-5 pb-5 text-sm leading-relaxed">
                {result.cashflow_forecast_comment}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
