"use client";

import { EscapePlanFollowUp } from "@/components/escape-plan/escape-plan-follow-up";
import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { chooseEscapeOption } from "@/lib/actions/escape-plans";
import { formatCurrency } from "@/lib/utils";
import {
  buildGoalsFocusText,
  escapeNotRecommendedLabel,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type EscapePlanOption,
  type EscapePlanResult,
  type UserCapabilities,
  type UserEscapePlan,
} from "@/types/escape-plan";
import { useState } from "react";

interface EscapePlanResultsProps {
  plan: EscapePlanResult;
  capabilities: UserCapabilities | null;
  initialEscapePlans?: UserEscapePlan[];
  initialPendingFollowUp?: UserEscapePlan | null;
}

export function EscapePlanResults({
  plan,
  capabilities,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
}: EscapePlanResultsProps) {
  const primaryGoal = resolvePrimaryGoal(capabilities);
  const secondaryGoals = resolveSecondaryGoals(capabilities);
  const goalsFocus = buildGoalsFocusText(primaryGoal, plan.goals_focus);

  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [pendingFollowUp, setPendingFollowUp] = useState(initialPendingFollowUp);
  const [choosingTitle, setChoosingTitle] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState("");

  const activePlan = escapePlans.find((p) => p.status === "active");
  const activeTitle = activePlan?.option_title ?? null;

  async function handleChoose(option: EscapePlanOption) {
    setChoosingTitle(option.title);
    setChooseError("");
    try {
      const saved = await chooseEscapeOption(option);
      setEscapePlans((prev) => [
        saved,
        ...prev
          .filter((p) => p.id !== saved.id)
          .map((p) =>
            p.status === "active" ? { ...p, status: "abandoned" as const } : p
          ),
      ]);
      setPendingFollowUp(null);
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setChoosingTitle(null);
    }
  }

  function handleFollowUpAnswered(updated: UserEscapePlan) {
    setEscapePlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setPendingFollowUp(updated);
  }

  return (
    <div className="space-y-6">
      {pendingFollowUp && (
        <EscapePlanFollowUp
          pending={pendingFollowUp}
          plan={plan}
          onAnswered={handleFollowUpAnswered}
        />
      )}

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
          . Сверху — с наибольшей вероятностью результата.
        </p>
        {chooseError && (
          <p className="text-sm text-red-400">{chooseError}</p>
        )}
        <div className="grid gap-4">
          {plan.options.map((option) => (
            <EscapePlanOptionCard
              key={option.title}
              option={option}
              isActive={activeTitle === option.title}
              choosing={choosingTitle === option.title}
              onChoose={handleChoose}
            />
          ))}
        </div>
      </div>

      {plan.not_recommended.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Чего лучше не делать</h2>
          <div className="space-y-2">
            {plan.not_recommended.map((item) => {
              const whyNot = item.why_not ?? item.reason;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted mt-2">{escapeNotRecommendedLabel(item)}:</p>
                  <p className="mt-1">{whyNot}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {plan.plan_7_days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">План на 7 дней</CardTitle>
            <CardDescription>
              Конкретные шаги — не обещание дохода, а порядок действий
            </CardDescription>
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
