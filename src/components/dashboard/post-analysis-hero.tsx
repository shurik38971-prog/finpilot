import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AnalysisApiResponse } from "@/types/analysis";
import { ArrowRight, CheckCircle2, Compass, FileText, Target } from "lucide-react";
import Link from "next/link";

interface PostAnalysisHeroProps {
  analysis: AnalysisApiResponse;
}

function firstMeaningfulText(...values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

function buildPriorityActions(analysis: AnalysisApiResponse): string[] {
  const candidates = [
    analysis.next_best_action?.title,
    ...(analysis.actions_30_days ?? []).map((item) => item.action),
    ...(analysis.plan_7_days ?? []).map((item) => item.action),
    ...(analysis.plan_30_days ?? []).map((item) => item.action),
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const action = candidate?.trim();
    if (!action) continue;

    const key = action.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(action);
    if (result.length === 3) break;
  }

  return result;
}

export function PostAnalysisHero({ analysis }: PostAnalysisHeroProps) {
  const summary =
    firstMeaningfulText(analysis.summary, analysis.health_explanation) ??
    "Разбор готов: мы собрали вашу ситуацию в понятную картину и выделили, с чего лучше начать.";
  const mainProblem =
    firstMeaningfulText(
      analysis.main_problem,
      analysis.main_threat,
      analysis.main_problem_label
    ) ?? "Главное препятствие пока не выделено.";
  const actions = buildPriorityActions(analysis);

  return (
    <section className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-surface-hover/50 p-4 shadow-lg shadow-accent/5 sm:p-5">
      <div className="mb-4 space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-wide">
            Разбор завершён
          </p>
        </div>
        <h1 className="text-2xl font-semibold leading-tight">
          Ваш финансовый разбор готов
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Мы собрали Ваши ответы в понятную картину и выделили, с чего лучше
          начать.
        </p>
      </div>

      <div className="grid gap-3">
        <Card className="!p-4 border-border/60 bg-surface/70">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Ситуация</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {summary}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 border-border/60 bg-surface/70">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">
                Главное, что требует внимания
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {mainProblem}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 border-border/60 bg-surface/70">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Первые 3 шага</h2>
              {actions.length > 0 ? (
                <ol className="mt-2 space-y-2">
                  {actions.map((action, index) => (
                    <li key={action} className="flex gap-2 text-sm text-muted">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Откройте план действий — там уже собраны ближайшие шаги.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Link href="/actions" className="min-w-0">
          <Button className="w-full" size="lg">
            Перейти к плану действий
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/escape-plan" className="min-w-0">
          <Button className="w-full" variant="secondary" size="lg">
            <Compass className="h-4 w-4" />
            Найти выход из ситуации
          </Button>
        </Link>
      </div>
    </section>
  );
}
