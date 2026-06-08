"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  buildGoalsFocusText,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type EscapePlanDifficulty,
  type EscapePlanResult,
  type UserCapabilities,
} from "@/types/escape-plan";

function difficultyLabel(difficulty: EscapePlanDifficulty): string {
  switch (difficulty) {
    case "low":
      return "Низкая";
    case "high":
      return "Высокая";
    default:
      return "Средняя";
  }
}

function difficultyVariant(
  difficulty: EscapePlanDifficulty
): "success" | "warning" | "danger" {
  switch (difficulty) {
    case "low":
      return "success";
    case "high":
      return "danger";
    default:
      return "warning";
  }
}

interface EscapePlanResultsProps {
  plan: EscapePlanResult;
  capabilities: UserCapabilities | null;
}

export function EscapePlanResults({ plan, capabilities }: EscapePlanResultsProps) {
  const primaryGoal = resolvePrimaryGoal(capabilities);
  const secondaryGoals = resolveSecondaryGoals(capabilities);
  const goalsFocus = buildGoalsFocusText(primaryGoal, plan.goals_focus);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Ваши цели</CardTitle>
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-muted">Главная</dt>
              <dd className="font-medium">{primaryGoal}</dd>
            </div>
            {secondaryGoals.length > 0 && (
              <div>
                <dt className="text-muted">Дополнительные</dt>
                <dd className="mt-1 space-y-1">
                  {secondaryGoals.map((goal) => (
                    <p key={goal} className="font-medium">
                      • {goal}
                    </p>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          <CardDescription>{goalsFocus}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сколько нужно улучшить</CardTitle>
          <CardDescription>{plan.situation_summary}</CardDescription>
        </CardHeader>
        <div className="px-5 pb-5">
          <p className="text-lg font-semibold">
            {plan.needed_amount > 0
              ? `Чтобы продвинуться к целям, нужно найти или освободить около ${formatCurrency(plan.needed_amount)} в месяц.`
              : "По расчёту дефицита нет — фокус на закреплении результата и движении к целям."}
          </p>
          {plan.main_strategy && (
            <p className="text-sm text-muted mt-2">
              Главное направление: {plan.main_strategy}
            </p>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Подходящие варианты</h2>
        <p className="text-sm text-muted">
          По вашим данным — {plan.options.length}{" "}
          {plan.options.length === 1
            ? "реалистичное направление"
            : plan.options.length < 5
              ? "реалистичных направления"
              : "реалистичных направлений"}
          .
        </p>
        <div className="grid gap-4">
          {plan.options.map((option) => (
            <Card key={option.title}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">{option.title}</CardTitle>
                  <Badge variant={difficultyVariant(option.difficulty)}>
                    Сложность: {difficultyLabel(option.difficulty)}
                  </Badge>
                </div>
                <CardDescription>{option.why_fits}</CardDescription>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted">Первый шаг</dt>
                    <dd>{option.first_step}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Примерный эффект</dt>
                    <dd className="font-medium text-emerald-400">
                      {option.expected_effect > 0
                        ? `≈ ${formatCurrency(option.expected_effect)} / мес`
                        : "эффект зависит от исполнения"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Время</dt>
                    <dd>{option.time_required || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Риск</dt>
                    <dd>{option.risk || "—"}</dd>
                  </div>
                </dl>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {plan.not_recommended.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Чего лучше не делать</h2>
          <div className="space-y-2">
            {plan.not_recommended.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-muted mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.plan_7_days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">План на 7 дней</CardTitle>
          </CardHeader>
          <ol className="px-5 pb-5 space-y-2 list-decimal list-inside text-sm">
            {plan.plan_7_days.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
