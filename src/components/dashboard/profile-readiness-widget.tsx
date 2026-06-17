import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileReadiness } from "@/lib/profile/profile-readiness";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Gauge } from "lucide-react";
import Link from "next/link";

export function ProfileReadinessWidget({
  readiness,
}: {
  readiness: ProfileReadiness;
}) {
  if (readiness.complete) return null;

  const nextStep = readiness.steps.find((step) => !step.done);

  return (
    <Card className="border-accent/25 bg-gradient-to-br from-accent/8 to-transparent !p-4">
      <CardHeader className="mb-3 !px-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          Хотите сделать разбор точнее?
        </CardTitle>
        <CardDescription className="text-xs">
          Добавьте расходы, долги и платежи позже — это поможет уточнить
          следующие рекомендации. Сейчас можно начать с плана действий.
        </CardDescription>
        <p className="mt-2 text-xs text-muted">
          Данных заполнено: {readiness.percent}%
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-surface-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
      </CardHeader>

      <ul className="space-y-1.5 text-sm">
        {readiness.steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <span className="flex items-center gap-2 text-muted">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{step.label}</span>
              </span>
            ) : (
              <Link
                href={step.href}
                className="flex items-center gap-2 text-foreground hover:text-accent transition-colors"
              >
                <Circle className="h-4 w-4 text-muted shrink-0" />
                <span>{step.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>

      {nextStep && (
        <p className={cn("mt-3 text-xs text-muted")}>
          Следующий шаг:{" "}
          <Link href={nextStep.href} className="text-accent hover:underline">
            {nextStep.label}
          </Link>
        </p>
      )}
    </Card>
  );
}
