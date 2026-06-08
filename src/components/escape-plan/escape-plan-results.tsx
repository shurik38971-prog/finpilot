"use client";

import { EscapePlanActiveDirection } from "@/components/escape-plan/escape-plan-active-direction";
import { EscapePlanFollowUp } from "@/components/escape-plan/escape-plan-follow-up";
import { EscapePlanNotRecommendedList } from "@/components/escape-plan/escape-plan-not-recommended";
import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { EscapePlanPrimaryCard } from "@/components/escape-plan/escape-plan-primary-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  chooseEscapeOption,
  getEscapePlanTasks,
} from "@/lib/actions/escape-plans";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import {
  buildSituationBrief,
  ESCAPE_VISIBLE_OPTIONS,
} from "@/lib/escape-plan/situation-brief";
import {
  getEffectiveSkills,
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
  const rankedOptions = useMemo(() => {
    if (getEffectiveSkills(capabilities).length === 0) return plan.options;
    return rankAndSortEscapePlanOptions(
      plan.options,
      buildEscapeRankingContext(capabilities)
    );
  }, [plan.options, capabilities]);

  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [pendingFollowUp, setPendingFollowUp] = useState(initialPendingFollowUp);
  const [activePlanTasks, setActivePlanTasks] = useState(initialActivePlanTasks);
  const [choosingTitle, setChoosingTitle] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const activePlan = escapePlans.find((p) => p.status === "active") ?? null;
  const activeTitle = activePlan?.option_title ?? null;

  const availableOptions = useMemo(() => {
    if (!activeTitle) return rankedOptions;
    return rankedOptions.filter((o) => o.title !== activeTitle);
  }, [rankedOptions, activeTitle]);

  const primaryOption = availableOptions[0] ?? null;
  const backupOptions = availableOptions.slice(1, ESCAPE_VISIBLE_OPTIONS);
  const hiddenOptions = availableOptions.slice(ESCAPE_VISIBLE_OPTIONS);

  const situationBrief = useMemo(
    () => buildSituationBrief(plan, primaryOption?.title ?? plan.main_strategy),
    [plan, primaryOption?.title]
  );

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
      setShowMoreOptions(false);
      setShowAlternatives(false);
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

      {activePlan ? (
        <>
          <EscapePlanActiveDirection
            activePlan={activePlan}
            steps={activePlanTasks}
          />

          {availableOptions.length > 0 && (
            <div className="space-y-3">
              {!showAlternatives ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlternatives(true)}
                  className="text-muted"
                >
                  Посмотреть альтернативные варианты
                </Button>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-muted">
                    Альтернативные варианты
                  </h2>
                  {chooseError && (
                    <p className="text-sm text-red-400">{chooseError}</p>
                  )}
                  <div className="grid gap-3">
                    {availableOptions.map((option, index) => (
                      <EscapePlanOptionCard
                        key={option.title}
                        option={option}
                        fitIndex={index}
                        choosing={choosingTitle === option.title}
                        onChoose={handleChoose}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <Card>
            <CardHeader className="space-y-2">
              <h2 className="text-base font-semibold">Что можно сделать</h2>
              <div className="text-sm text-muted space-y-2 leading-relaxed">
                {situationBrief.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </CardHeader>
          </Card>

          {primaryOption && (
            <EscapePlanPrimaryCard
              option={primaryOption}
              choosing={choosingTitle === primaryOption.title}
              onChoose={handleChoose}
            />
          )}

          {backupOptions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted">Запасные варианты</h2>
              {chooseError && (
                <p className="text-sm text-red-400">{chooseError}</p>
              )}
              <div className="grid gap-3">
                {backupOptions.map((option, index) => (
                  <EscapePlanOptionCard
                    key={option.title}
                    option={option}
                    fitIndex={index + 1}
                    choosing={choosingTitle === option.title}
                    onChoose={handleChoose}
                  />
                ))}
              </div>
            </div>
          )}

          {hiddenOptions.length > 0 && (
            <div className="space-y-3">
              {!showMoreOptions ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreOptions(true)}
                  className="text-muted"
                >
                  Показать ещё варианты ({hiddenOptions.length})
                </Button>
              ) : (
                <div className="grid gap-3">
                  {hiddenOptions.map((option, index) => (
                    <EscapePlanOptionCard
                      key={option.title}
                      option={option}
                      fitIndex={ESCAPE_VISIBLE_OPTIONS + index}
                      choosing={choosingTitle === option.title}
                      onChoose={handleChoose}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!activePlan && <EscapePlanNotRecommendedList items={plan.not_recommended} />}

      {onRegenerate && (
        <p className="text-sm text-muted">
          Изменились обстоятельства?{" "}
          <button
            type="button"
            onClick={onRegenerate}
            className="text-accent hover:underline"
          >
            Обновить анкету
          </button>
        </p>
      )}
    </div>
  );
}
