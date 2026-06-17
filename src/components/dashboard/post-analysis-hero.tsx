import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AnalysisApiResponse } from "@/types/analysis";
import { ArrowRight, CheckCircle2, Compass, FileText, Target } from "lucide-react";
import Link from "next/link";

interface PostAnalysisHeroProps {
  analysis: AnalysisApiResponse;
  financialIndex?: number | null;
}

function firstMeaningfulText(...values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

const TECHNICAL_SITUATION_PATTERNS = [
  "предварительная оценка",
  "точность будет расти",
  "добавьте доход",
  "добавьте расходы",
  "добавьте долги",
  "добавьте платеж",
  "добавьте платёж",
  "добавьте доходы, расходы, долги",
  "финпилот уже использует",
  "на основе ответов",
] as const;

function isTechnicalSituationText(text: string) {
  const normalized = text.toLowerCase();
  return TECHNICAL_SITUATION_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function firstDiagnosticText(...values: Array<string | null | undefined>) {
  return values.find((value) => {
    const text = value?.trim();
    return text && !isTechnicalSituationText(text);
  })?.trim() ?? null;
}

const PROFILE_FILL_ACTION_PATTERNS = [
  "добавить доход",
  "добавьте доход",
  "заполнить доход",
  "указать доход",
  "внести доход",
  "добавить расход",
  "добавьте расход",
  "заполнить расход",
  "указать расход",
  "внести расход",
  "добавить долг",
  "добавьте долг",
  "заполнить долг",
  "указать долг",
  "внести долг",
  "добавить платеж",
  "добавить платёж",
  "добавьте платеж",
  "добавьте платёж",
  "указать платеж",
  "указать платёж",
  "заполнить профиль",
  "заполните профиль",
  "дополнить профиль",
  "дополните профиль",
  "добавить данные",
  "добавьте данные",
  "внести данные",
  "расходы, долги",
] as const;

function isProfileFillAction(action: string) {
  const normalized = action.toLowerCase();
  return PROFILE_FILL_ACTION_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function buildPriorityActions(analysis: AnalysisApiResponse): string[] {
  const candidates = [
    analysis.next_best_action?.title,
    ...(analysis.actions_30_days ?? []).map((item) => item.action),
    ...(analysis.plan_7_days ?? []).map((item) => item.action),
    ...(analysis.plan_30_days ?? []).map((item) => item.action),
  ];

  const seen = new Set<string>();
  const meaningful: string[] = [];
  const profileFill: string[] = [];

  for (const candidate of candidates) {
    const action = candidate?.trim();
    if (!action) continue;

    const key = action.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    if (isProfileFillAction(action)) {
      profileFill.push(action);
    } else {
      meaningful.push(action);
    }
  }

  return [...meaningful, ...profileFill].slice(0, 3);
}

function describeFinancialIndex(index?: number | null) {
  if (index == null) return null;
  if (index >= 70) {
    return "Картина выглядит устойчивой, но первые шаги помогут закрепить результат.";
  }
  if (index >= 40) {
    return "Ситуация управляемая, но есть место, которое лучше укрепить в первую очередь.";
  }
  return "Сейчас важно быстро снизить давление на бюджет и выбрать один понятный следующий шаг.";
}

function diagnoseByProblem(problem: string) {
  const normalized = problem.toLowerCase();

  if (
    normalized.includes("долг") ||
    normalized.includes("кредит") ||
    normalized.includes("платеж") ||
    normalized.includes("платёж") ||
    normalized.includes("обязатель")
  ) {
    return "Сейчас значительная часть свободного остатка уходит на обязательные платежи. Из-за этого запас прочности небольшой, а любая непредвиденная трата может снова выбить бюджет из равновесия.";
  }

  if (
    normalized.includes("подуш") ||
    normalized.includes("резерв") ||
    normalized.includes("запас") ||
    normalized.includes("безопасност")
  ) {
    return "Сейчас главная слабая точка — отсутствие запаса на непредвиденные расходы. Поэтому первый фокус — не усложнять бюджет и постепенно собрать минимальную подушку безопасности.";
  }

  if (
    normalized.includes("расход") ||
    normalized.includes("трат") ||
    normalized.includes("утеч") ||
    normalized.includes("лишн")
  ) {
    return "Сейчас важно увидеть, какие расходы забирают больше всего свободных денег. Это поможет найти запас без резкого ухудшения качества жизни.";
  }

  if (
    normalized.includes("доход") ||
    normalized.includes("заработ") ||
    normalized.includes("поступлен")
  ) {
    return "Сейчас главный рычаг — усилить регулярные поступления и не распыляться на случайные шаги. Лучше выбрать один понятный способ увеличить доход и довести его до первого результата.";
  }

  return `Разбор показывает главный фокус: ${problem}. Сейчас лучше не распыляться и начать с одного практического шага, который быстрее всего снизит напряжение.`;
}

function buildSituationText(
  analysis: AnalysisApiResponse,
  financialIndex?: number | null
) {
  const summary = firstDiagnosticText(
    analysis.summary,
    analysis.health_explanation
  );
  if (summary) return summary;

  const problem = firstMeaningfulText(
    analysis.main_problem,
    analysis.main_threat,
    analysis.main_problem_label
  );
  const problemDiagnosis = problem ? diagnoseByProblem(problem) : null;

  if (problemDiagnosis) return problemDiagnosis;

  const indexText = describeFinancialIndex(financialIndex);
  if (indexText) return indexText;

  return "Разбор уже показывает первые ориентиры. Сейчас важно зафиксировать ближайшие обязательные платежи и выбрать один практический шаг на сегодня.";
}

export function PostAnalysisHero({
  analysis,
  financialIndex,
}: PostAnalysisHeroProps) {
  const summary = buildSituationText(analysis, financialIndex);
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
            Подобрать маршрут дохода
          </Button>
        </Link>
      </div>
    </section>
  );
}
