"use client";

import { EscapePlanActiveDirection } from "@/components/escape-plan/escape-plan-active-direction";
import { EscapePlanFollowUp } from "@/components/escape-plan/escape-plan-follow-up";
import { EscapePlanNotRecommendedList } from "@/components/escape-plan/escape-plan-not-recommended";
import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { EscapePlanPrimaryCard } from "@/components/escape-plan/escape-plan-primary-card";
import { RescuePlanCard } from "@/components/escape-plan/rescue-plan-card";
import { RescueProgressCard } from "@/components/escape-plan/rescue-progress-card";
import { useCopy } from "@/components/copy/site-copy-provider";
import { Button } from "@/components/ui/button";
import {
  chooseEscapeOption,
  getEscapePlanTasks,
} from "@/lib/actions/escape-plans";
import { buildRescuePlan, buildRescueProgressFromPlan } from "@/lib/escape-plan/build-rescue-plan";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import { ESCAPE_VISIBLE_OPTIONS } from "@/lib/escape-plan/situation-brief";
import {
  getEffectiveSkills,
  resolvePrimaryGoal,
  type EscapePlanOption,
  type EscapePlanResult,
  type UserCapabilities,
  type UserEscapePlan,
} from "@/types/escape-plan";
import {
  isActiveEscapeAttempt,
  resolveAttemptStatus,
  type RescuePlan,
} from "@/types/rescue-plan";
import type { FinancialTask } from "@/types/tasks";
import { useMemo, useState } from "react";

interface EscapePlanResultsProps {
  plan: EscapePlanResult;
  capabilities: UserCapabilities;
  financialSnapshot: {
    monthlyIncome: number;
    netCashFlow: number;
    totalDebt: number;
  };
  initialRescuePlan?: RescuePlan | null;
  initialEscapePlans?: UserEscapePlan[];
  initialPendingFollowUp?: UserEscapePlan | null;
  initialActivePlanTasks?: FinancialTask[];
  onRegenerate?: () => void;
}

export function EscapePlanResults({
  plan,
  capabilities,
  financialSnapshot,
  initialRescuePlan = null,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
  initialActivePlanTasks = [],
  onRegenerate,
}: EscapePlanResultsProps) {
  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [pendingFollowUp, setPendingFollowUp] = useState(initialPendingFollowUp);
  const [activePlanTasks, setActivePlanTasks] = useState(initialActivePlanTasks);
  const [choosingTitle, setChoosingTitle] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const backupOptionsLabel = useCopy("escape.backup_options");

  const failedPlans = useMemo(
    () =>
      escapePlans.filter(
        (item) =>
          resolveAttemptStatus(item) === "failed" && Boolean(item.failure_reason)
      ),
    [escapePlans]
  );

  const rankedOptions = useMemo(() => {
    if (getEffectiveSkills(capabilities).length === 0) return plan.options;
    return rankAndSortEscapePlanOptions(
      plan.options,
      buildEscapeRankingContext(capabilities, failedPlans)
    );
  }, [plan.options, capabilities, failedPlans]);

  const activePlan =
    escapePlans.find((p) => isActiveEscapeAttempt(p)) ?? null;
  const activeTitle = activePlan?.option_title ?? null;

  const availableOptions = useMemo(() => {
    if (!activeTitle) return rankedOptions;
    return rankedOptions.filter((o) => o.title !== activeTitle);
  }, [rankedOptions, activeTitle]);

  const primaryOption = availableOptions[0] ?? null;
  const backupOptions = availableOptions.slice(1, ESCAPE_VISIBLE_OPTIONS);
  const hiddenOptions = availableOptions.slice(ESCAPE_VISIBLE_OPTIONS);

  const rescuePlan = useMemo(() => {
    if (initialRescuePlan && !activePlan) return initialRescuePlan;
    return buildRescuePlan({
      ...financialSnapshot,
      primaryGoal: resolvePrimaryGoal(capabilities),
      escapePlan: plan,
      topOption: primaryOption ?? rankedOptions[0] ?? null,
      activePlan,
      pendingTasks: activePlanTasks,
    });
  }, [
    initialRescuePlan,
    activePlan,
    financialSnapshot,
    capabilities,
    plan,
    primaryOption,
    rankedOptions,
    activePlanTasks,
  ]);

  const progress = useMemo(() => {
    if (!activePlan) return null;
    return buildRescueProgressFromPlan(
      rescuePlan,
      activePlan.income_found ?? 0
    );
  }, [activePlan, rescuePlan]);

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
            isActiveEscapeAttempt(p)
              ? { ...p, status: "abandoned" as const, attempt_status: "failed" as const }
              : p
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
  }

  function handleAttemptFailed(updated: UserEscapePlan) {
    setEscapePlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setPendingFollowUp(null);
    setActivePlanTasks([]);
  }

  return (
    <div className="space-y-6">
      <RescuePlanCard plan={rescuePlan} />

      {progress && activePlan && (
        <RescueProgressCard
          progress={progress}
          activeGoal={activePlan.active_goal}
        />
      )}

      {pendingFollowUp && (
        <EscapePlanFollowUp
          pending={pendingFollowUp}
          plan={plan}
          onAnswered={handleFollowUpAnswered}
          onFailed={handleAttemptFailed}
        />
      )}

      {activePlan ? (
        <>
          <EscapePlanActiveDirection
            activePlan={activePlan}
            steps={activePlanTasks}
            onFailed={handleAttemptFailed}
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
          {primaryOption && (
            <EscapePlanPrimaryCard
              option={primaryOption}
              choosing={choosingTitle === primaryOption.title}
              onChoose={handleChoose}
            />
          )}

          {backupOptions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted">{backupOptionsLabel}</h2>
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
