"use client";

import { EscapePlanActiveRouteBlock } from "@/components/escape-plan/escape-plan-active-route-block";
import { EscapePlanAlternativeRoutesBlock } from "@/components/escape-plan/escape-plan-alternative-routes-block";
import { EscapePlanFinancialMeasuresBlock } from "@/components/escape-plan/escape-plan-financial-measures-block";
import { EscapePlanFollowUp } from "@/components/escape-plan/escape-plan-follow-up";
import { EscapePlanNotRecommendedList } from "@/components/escape-plan/escape-plan-not-recommended";
import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { EscapePlanPrimaryCard } from "@/components/escape-plan/escape-plan-primary-card";
import { EscapePlanQuickActionsBlock } from "@/components/escape-plan/escape-plan-quick-actions-block";
import { EscapeRouteActivateModal } from "@/components/escape-plan/escape-route-activate-modal";
import { RescuePlanCard } from "@/components/escape-plan/rescue-plan-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCopy } from "@/components/copy/site-copy-provider";
import {
  activateEscapeOption,
  activateSavedEscapeRoute,
  chooseEscapeOption,
  getEscapePlanTasks,
  saveEscapeOptionAsAlternative,
} from "@/lib/actions/escape-plans";
import { buildRescuePlan, buildRescueProgressFromPlan } from "@/lib/escape-plan/build-rescue-plan";
import { computeRouteStepProgress } from "@/lib/escape-plan/route-progress";
import { buildEscapeRankingContext } from "@/lib/escape-plan/capabilities-context";
import { partitionEscapePlanOptions } from "@/lib/escape-plan/recommendation-types";
import { rankAndSortEscapePlanOptions } from "@/lib/escape-plan/rank-options";
import { ESCAPE_VISIBLE_OPTIONS } from "@/lib/escape-plan/situation-brief";
import {
  getEffectiveSkills,
  isAlternativeEscapePlan,
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
  initialFinancialMeasureTasks?: FinancialTask[];
  mainFinancialGoal?: string;
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
  initialFinancialMeasureTasks = [],
  mainFinancialGoal,
  onRegenerate,
}: EscapePlanResultsProps) {
  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [pendingFollowUp, setPendingFollowUp] = useState(initialPendingFollowUp);
  const [activePlanTasks, setActivePlanTasks] = useState(initialActivePlanTasks);
  const [financialMeasureTasks] = useState(initialFinancialMeasureTasks);
  const [choosingTitle, setChoosingTitle] = useState<string | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [pendingActivate, setPendingActivate] = useState<
    | { kind: "option"; option: EscapePlanOption }
    | { kind: "saved"; plan: UserEscapePlan }
    | null
  >(null);
  const backupOptionsLabel = useCopy("escape.backup_options");
  const noRouteTitle = useCopy("escape.no_route_selected_title");
  const noRouteHint = useCopy("escape.no_route_selected_hint");
  const recommendationsTitle = useCopy("escape.route_recommendations_title");
  const chooseRouteLabel = useCopy("btn.try_option");

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

  const { incomeRoutes: rankedIncomeRoutes, financialMeasures } = useMemo(
    () => partitionEscapePlanOptions(rankedOptions),
    [rankedOptions]
  );

  const activePlan =
    escapePlans.find((p) => isActiveEscapeAttempt(p)) ?? null;
  const activeTitle = activePlan?.option_title ?? null;
  const savedAlternativePlans = useMemo(
    () => escapePlans.filter((plan) => isAlternativeEscapePlan(plan)),
    [escapePlans]
  );
  const reservedIncomeTitles = useMemo(() => {
    const titles = new Set<string>();
    if (activeTitle) titles.add(activeTitle);
    for (const item of savedAlternativePlans) {
      titles.add(item.option_title);
    }
    return titles;
  }, [activeTitle, savedAlternativePlans]);

  const availableIncomeRoutes = useMemo(
    () =>
      rankedIncomeRoutes.filter((option) => !reservedIncomeTitles.has(option.title)),
    [rankedIncomeRoutes, reservedIncomeTitles]
  );

  const primaryIncomeRoute = availableIncomeRoutes[0] ?? null;
  const backupIncomeRoutes = availableIncomeRoutes.slice(1, ESCAPE_VISIBLE_OPTIONS);
  const hiddenIncomeRoutes = availableIncomeRoutes.slice(ESCAPE_VISIBLE_OPTIONS);

  const rescuePlan = useMemo(() => {
    if (initialRescuePlan && !activePlan) return initialRescuePlan;
    return buildRescuePlan({
      ...financialSnapshot,
      primaryGoal: mainFinancialGoal ?? resolvePrimaryGoal(capabilities),
      escapePlan: plan,
      topOption: primaryIncomeRoute ?? rankedIncomeRoutes[0] ?? null,
      activePlan,
      pendingTasks: activePlanTasks,
    });
  }, [
    initialRescuePlan,
    activePlan,
    financialSnapshot,
    capabilities,
    plan,
    primaryIncomeRoute,
    rankedIncomeRoutes,
    activePlanTasks,
    mainFinancialGoal,
  ]);

  const progress = useMemo(() => {
    if (!activePlan) return null;
    const routeTasks = activePlanTasks.filter(
      (task) => task.escape_plan_id === activePlan.id
    );
    const incomeSnapshot = buildRescueProgressFromPlan(
      rescuePlan,
      activePlan.income_found ?? 0
    );
    const stepProgress = computeRouteStepProgress(routeTasks);
    return {
      ...incomeSnapshot,
      percent: stepProgress.percent,
    };
  }, [activePlan, rescuePlan, activePlanTasks]);

  async function applyActiveRoute(saved: UserEscapePlan) {
    const tasks = await getEscapePlanTasks(saved.id);
    setEscapePlans((prev) => [
      saved,
      ...prev
        .filter((item) => item.id !== saved.id)
        .map((item) => {
          if (item.id === activePlan?.id || isActiveEscapeAttempt(item)) {
            return { ...item, status: "alternative" as const };
          }
          return item;
        }),
    ]);
    setActivePlanTasks(tasks);
    setPendingFollowUp(null);
    setShowMoreOptions(false);
    setPendingActivate(null);
  }

  async function handleChoose(option: EscapePlanOption) {
    setChoosingTitle(option.title);
    setChooseError("");
    try {
      const saved = await chooseEscapeOption(option);
      await applyActiveRoute(saved);
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setChoosingTitle(null);
    }
  }

  async function handleConfirmActivate() {
    if (!pendingActivate) return;
    setChooseError("");

    if (pendingActivate.kind === "option") {
      setChoosingTitle(pendingActivate.option.title);
      try {
        const saved = await activateEscapeOption(pendingActivate.option);
        await applyActiveRoute(saved);
      } catch (err) {
        setChooseError(err instanceof Error ? err.message : "Не удалось переключить");
      } finally {
        setChoosingTitle(null);
      }
      return;
    }

    setActivatingPlanId(pendingActivate.plan.id);
    try {
      const saved = await activateSavedEscapeRoute(pendingActivate.plan.id);
      await applyActiveRoute(saved);
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Не удалось переключить");
    } finally {
      setActivatingPlanId(null);
    }
  }

  async function handleSaveAsAlternative(option: EscapePlanOption) {
    setChoosingTitle(option.title);
    setChooseError("");
    try {
      const saved = await saveEscapeOptionAsAlternative(option);
      setEscapePlans((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    } catch (err) {
      setChooseError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setChoosingTitle(null);
    }
  }

  function requestActivateOption(option: EscapePlanOption) {
    if (!activePlan) {
      void handleChoose(option);
      return;
    }
    setChooseError("");
    setPendingActivate({ kind: "option", option });
  }

  function requestActivateSaved(plan: UserEscapePlan) {
    if (!activePlan) {
      void (async () => {
        setActivatingPlanId(plan.id);
        try {
          const saved = await activateSavedEscapeRoute(plan.id);
          await applyActiveRoute(saved);
        } catch (err) {
          setChooseError(err instanceof Error ? err.message : "Не удалось переключить");
        } finally {
          setActivatingPlanId(null);
        }
      })();
      return;
    }
    setChooseError("");
    setPendingActivate({ kind: "saved", plan });
  }

  const activateNewTitle =
    pendingActivate?.kind === "option"
      ? pendingActivate.option.title
      : pendingActivate?.kind === "saved"
        ? pendingActivate.plan.option_title
        : "";
  const routeActionLoading =
    choosingTitle != null || activatingPlanId != null;

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

  function scrollToRouteAlternatives() {
    document
      .getElementById("route-alternatives")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <EscapeRouteActivateModal
        open={pendingActivate != null && activePlan != null}
        currentRouteTitle={activePlan?.option_title ?? ""}
        newRouteTitle={activateNewTitle}
        error={chooseError}
        loading={routeActionLoading}
        onClose={() => {
          if (!routeActionLoading) {
            setPendingActivate(null);
            setChooseError("");
          }
        }}
        onConfirm={() => void handleConfirmActivate()}
      />

      <RescuePlanCard plan={rescuePlan} />

      {pendingFollowUp && (
        <EscapePlanFollowUp
          pending={pendingFollowUp}
          plan={plan}
          onAnswered={handleFollowUpAnswered}
          onFailed={handleAttemptFailed}
        />
      )}

      {activePlan && progress ? (
        <EscapePlanActiveRouteBlock
          activePlan={activePlan}
          steps={activePlanTasks}
          mainFinancialGoal={mainFinancialGoal}
          progress={progress}
          onFailed={handleAttemptFailed}
          onChangeRoute={scrollToRouteAlternatives}
        />
      ) : (
        availableIncomeRoutes.length > 0 && (
          <section className="space-y-4">
            <Card className="border-border/60 bg-surface/25">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{noRouteTitle}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {noRouteHint}
                </CardDescription>
              </CardHeader>
            </Card>

            <h2 className="text-base font-semibold">{recommendationsTitle}</h2>
            {primaryIncomeRoute && (
              <EscapePlanPrimaryCard
                option={primaryIncomeRoute}
                choosing={choosingTitle === primaryIncomeRoute.title}
                onChoose={handleChoose}
                actionLabel={chooseRouteLabel}
              />
            )}
            {backupIncomeRoutes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted">{backupOptionsLabel}</h3>
                {chooseError && (
                  <p className="text-sm text-red-400">{chooseError}</p>
                )}
                <div className="grid gap-3">
                  {backupIncomeRoutes.map((option, index) => (
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
            {hiddenIncomeRoutes.length > 0 && (
              <div className="space-y-3">
                {!showMoreOptions ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreOptions(true)}
                    className="text-muted"
                  >
                    Показать ещё маршруты ({hiddenIncomeRoutes.length})
                  </Button>
                ) : (
                  <div className="grid gap-3">
                    {hiddenIncomeRoutes.map((option, index) => (
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
          </section>
        )
      )}

      <EscapePlanAlternativeRoutesBlock
        id="route-alternatives"
        savedPlans={savedAlternativePlans}
        incomeOptions={activePlan ? availableIncomeRoutes : []}
        activatingId={activatingPlanId}
        choosingTitle={choosingTitle}
        onActivateSaved={requestActivateSaved}
        onChooseOption={requestActivateOption}
        chooseRouteLabel={chooseRouteLabel}
        onSaveOptionAsAlternative={
          activePlan ? (option) => void handleSaveAsAlternative(option) : undefined
        }
      />

      <EscapePlanFinancialMeasuresBlock
        options={financialMeasures}
        tasks={financialMeasureTasks}
      />

      <EscapePlanQuickActionsBlock />

      {!activePlan && (
        <EscapePlanNotRecommendedList items={plan.not_recommended} />
      )}

      {chooseError && !pendingActivate && (
        <p className="text-sm text-red-400">{chooseError}</p>
      )}

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
