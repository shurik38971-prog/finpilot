"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserEscapePlan } from "@/types/escape-plan";
import { Loader2 } from "lucide-react";

interface EscapePlanSavedAlternativesProps {
  plans: UserEscapePlan[];
  activatingId: string | null;
  onActivate: (plan: UserEscapePlan) => void;
}

export function EscapePlanSavedAlternatives({
  plans,
  activatingId,
  onActivate,
}: EscapePlanSavedAlternativesProps) {
  if (plans.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-muted">Альтернативные маршруты</h2>
      <div className="grid gap-3">
        {plans.map((plan) => {
          const loading = activatingId === plan.id;
          return (
            <Card key={plan.id}>
              <CardHeader className="space-y-3 p-4 sm:p-5">
                <div>
                  <CardTitle className="text-base">{plan.option_title}</CardTitle>
                  <CardDescription className="mt-1">
                    {plan.active_goal ?? plan.option_snapshot?.first_step ?? "Сохранённый вариант"}
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activatingId != null}
                  onClick={() => onActivate(plan)}
                  className="w-full sm:w-fit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Переключение...
                    </>
                  ) : (
                    "Сделать активным"
                  )}
                </Button>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
