"use client";

import { EscapePlanActiveDirection } from "@/components/escape-plan/escape-plan-active-direction";
import { EscapePlanFollowUp } from "@/components/escape-plan/escape-plan-follow-up";
import { EscapePlanNotRecommendedList } from "@/components/escape-plan/escape-plan-not-recommended";
import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chooseEscapeOption,
  getEscapePlanTasks,
} from "@/lib/actions/escape-plans";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import {
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type EscapePlanOption,
  type EscapePlanResult,
  type UserCapabilities,
  type UserEscapePlan,
} from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";
import { useMemo, useState } from "react";

interface EscapePlanResultsProps {
  plan: EscapePlanResult;
  capabilities: UserCapabilities;
  initialEscapePlans?: UserEscapePlan[];
  initialPendingFollowUp?: UserEscapePlan | null;
  initialActivePlanTasks?: FinancialTask[];
  onRegenerate?: () => void;
}

export function EscapePlanResults({
  plan,
  capabilities,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
  initialActivePlanTasks = [],
  onRegenerate,
}: EscapePlanResultsProps) {
  const primaryGoal = resolvePrimaryGoal(capabilities);
  const secondaryGoals = resolveSecondaryGoals(capabilities);

  const rankedOptions = useMemo(() => {
    if (!capabilities.skills.length) return plan.options;
    return rankAndSortEscapePlanOptions(plan.options, {
      skills: capabilities.skills,
      constraints: capabilities.constraints,
      primaryGoal,
      secondaryGoals,
    });
  }, [plan.options, capabilities, primaryGoal, secondaryGoals]);

  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [pendingFollowUp, setPendingFollowUp] = useState(initialPendingFollowUp);
  const [activePlanTasks, setActivePlanTasks] = useState(initialActivePlanTasks);
  const [choosingTitle, setChoosingTitle] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState("");

  const activePlan = escapePlans.find((p) => p.status === "active") ?? null;
  const activeTitle = activePlan?.option_title ?? null;

  const otherOptions = useMemo(() => {
    if (!activeTitle) return rankedOptions;
    return rankedOptions.filter((o) => o.title !== activeTitle);
  }, [rankedOptions, activeTitle]);

  async function handleChoose(option: EscapePlanOption) {
    setChoosingTitle(option.title);
    setChooseError("");
    try {
      const saved = await chooseEscapeOption(option, plan.plan_7_days);
      const tasks = await getEscapePlanTasks(saved.id);
      setEscapePlans((prev) => [
        saved,
        ...prev
          .filter((p) => p.id !== saved.id)
          .map((p) =>
            p.status === "active" ? { ...p, status: "abandoned" as const } : p
          ),
      ]);
      setActivePlanTasks(tasks);
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
    if (updated.follow_up_answer === "no") {
      setActivePlanTasks([]);
    }
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

      {activePlan && (
        <EscapePlanActiveDirection
          activePlan={activePlan}
          steps={activePlanTasks}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Что можно сделать</CardTitle>
          <CardDescription>{plan.situation_summary}</CardDescription>
          {plan.main_strategy && (
            <p className="text-sm text-muted pt-1">
              Главный фокус: {plan.main_strategy}
            </p>
          )}
        </CardHeader>
      </Card>

      {otherOptions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {activePlan ? "Другие варианты" : "Подходящие варианты"}
          </h2>
          <p className="text-sm text-muted">
            {otherOptions.length}{" "}
            {otherOptions.length === 1
              ? "направление"
              : otherOptions.length < 5
                ? "направления"
                : "направлений"}{" "}
            с учётом ваших навыков и ограничений.
          </p>
          {chooseError && (
            <p className="text-sm text-red-400">{chooseError}</p>
          )}
          <div className="grid gap-4">
            {otherOptions.map((option, index) => (
              <EscapePlanOptionCard
                key={option.title}
                option={option}
                fitIndex={index}
                fitTotal={otherOptions.length}
                isActive={false}
                choosing={choosingTitle === option.title}
                onChoose={handleChoose}
              />
            ))}
          </div>
        </div>
      )}

      <EscapePlanNotRecommendedList items={plan.not_recommended} />

      {onRegenerate && (
        <p className="text-sm text-muted">
          Изменились обстоятельства?{" "}
          <button
            type="button"
            onClick={onRegenerate}
            className="text-accent hover:underline"
          >
            Обновить анкету и варианты
          </button>
        </p>
      )}
    </div>
  );
}
