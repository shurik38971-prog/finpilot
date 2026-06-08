"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RescuePlan } from "@/types/rescue-plan";

interface RescuePlanCardProps {
  plan: RescuePlan;
}

function SituationLines({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <dl className="space-y-1 text-sm">
      {lines.map((line) => {
        const [label, ...rest] = line.split(":");
        const value = rest.join(":").trim();
        return (
          <div key={line} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium text-right">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function RescuePlanCard({ plan }: RescuePlanCardProps) {
  return (
    <Card className="border-accent/40 bg-gradient-to-b from-accent/10 to-transparent">
      <CardHeader className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent mb-1">
            План спасения
          </p>
          <CardTitle className="text-lg">Где вы сейчас и что делать</CardTitle>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Текущая ситуация</h3>
          <SituationLines text={plan.currentSituation} />
        </section>

        <section className="space-y-1">
          <h3 className="text-sm font-medium">Главная проблема</h3>
          <p className="text-sm text-muted leading-relaxed">{plan.mainProblem}</p>
        </section>

        {plan.monthlyGap > 0 && (
          <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-sm text-muted">Не хватает</p>
            <p className="text-xl font-semibold mt-0.5">
              ≈ {formatCurrency(plan.monthlyGap)} в месяц
            </p>
          </section>
        )}

        <section className="space-y-1">
          <h3 className="text-sm font-medium">Лучший вариант</h3>
          <p className="text-sm font-semibold">{plan.recommendedPath}</p>
        </section>

        <section className="space-y-1">
          <h3 className="text-sm font-medium">Следующий шаг</h3>
          <p className="text-sm leading-relaxed">{plan.nextAction}</p>
        </section>

        <section className="space-y-1">
          <h3 className="text-sm font-medium">Ожидаемый результат</h3>
          <p className="text-sm text-muted leading-relaxed">{plan.expectedResult}</p>
        </section>
      </CardHeader>
    </Card>
  );
}
