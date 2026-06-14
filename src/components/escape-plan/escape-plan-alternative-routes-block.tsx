"use client";

import { EscapePlanOptionCard } from "@/components/escape-plan/escape-plan-option-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compactRisk, compactWhyReasons } from "@/lib/escape-plan/option-display";
import { formatEscapeIncomeRange, type EscapePlanOption, type UserEscapePlan } from "@/types/escape-plan";
import { Loader2 } from "lucide-react";

interface EscapePlanAlternativeRoutesBlockProps {
  id?: string;
  savedPlans: UserEscapePlan[];
  incomeOptions: EscapePlanOption[];
  activatingId: string | null;
  choosingTitle: string | null;
  onActivateSaved: (plan: UserEscapePlan) => void;
  onChooseOption: (option: EscapePlanOption) => void;
  chooseRouteLabel?: string;
  onSaveOptionAsAlternative?: (option: EscapePlanOption) => void;
}

function SavedAlternativeCard({
  plan,
  loading,
  disabled,
  onActivate,
  activateLabel,
}: {
  plan: UserEscapePlan;
  loading: boolean;
  disabled: boolean;
  onActivate: () => void;
  activateLabel: string;
}) {
  const option = plan.option_snapshot;
  const incomeRange = formatEscapeIncomeRange(option);
  const whyReasons = compactWhyReasons(option, 3);

  return (
    <Card>
      <CardHeader className="space-y-3 p-4 sm:p-5">
        <CardTitle className="text-base">{plan.option_title}</CardTitle>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted">Потенциал: </span>
            <span className="font-medium">{incomeRange ?? "зависит от рынка"}</span>
          </p>
          <p>
            <span className="text-muted">Первый шаг: </span>
            {option.first_step || "—"}
          </p>
          {whyReasons.length > 0 && (
            <p>
              <span className="text-muted">Почему подходит: </span>
              {whyReasons.join(" · ")}
            </p>
          )}
          <p>
            <span className="text-muted">Риск: </span>
            {compactRisk(option, 80)}
          </p>
        </div>
        <CardDescription className="text-xs">Сохранённый альтернативный маршрут</CardDescription>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onActivate}
          className="w-full sm:w-fit"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Переключение...
            </>
          ) : (
            activateLabel
          )}
        </Button>
      </CardHeader>
    </Card>
  );
}

export function EscapePlanAlternativeRoutesBlock({
  id,
  savedPlans,
  incomeOptions,
  activatingId,
  choosingTitle,
  onActivateSaved,
  onChooseOption,
  chooseRouteLabel = "Выбрать этот маршрут",
  onSaveOptionAsAlternative,
}: EscapePlanAlternativeRoutesBlockProps) {
  if (savedPlans.length === 0 && incomeOptions.length === 0) return null;

  return (
    <section id={id} className="space-y-3 scroll-mt-6">
      <h2 className="text-base font-semibold text-muted">Альтернативные маршруты</h2>
      <div className="grid gap-3">
        {savedPlans.map((plan) => (
          <SavedAlternativeCard
            key={plan.id}
            plan={plan}
            loading={activatingId === plan.id}
            disabled={activatingId != null || choosingTitle != null}
            onActivate={() => onActivateSaved(plan)}
            activateLabel={chooseRouteLabel}
          />
        ))}
        {incomeOptions.map((option, index) => (
          <EscapePlanOptionCard
            key={option.title}
            option={option}
            fitIndex={index}
            choosing={choosingTitle === option.title}
            actionLabel={chooseRouteLabel}
            onChoose={onChooseOption}
            onSaveAsAlternative={onSaveOptionAsAlternative}
          />
        ))}
      </div>
    </section>
  );
}
