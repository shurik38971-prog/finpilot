"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { compactRisk, compactWhyReasons } from "@/lib/escape-plan/option-display";
import { completeTask } from "@/lib/actions/tasks";
import type { EscapePlanOption } from "@/types/escape-plan";
import type { FinancialTask } from "@/types/tasks";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EscapePlanFinancialMeasuresBlockProps {
  options: EscapePlanOption[];
  tasks: FinancialTask[];
}

function measureKey(title: string) {
  return title.trim().toLowerCase();
}

export function EscapePlanFinancialMeasuresBlock({
  options,
  tasks,
}: EscapePlanFinancialMeasuresBlockProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (options.length === 0) return null;

  const taskByTitle = new Map(
    tasks.map((task) => [measureKey(task.title), task])
  );

  async function handleComplete(taskId: string) {
    setLoadingId(taskId);
    try {
      await completeTask(taskId);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Финансовые меры</h2>
        <p className="text-sm text-muted mt-1">
          Отдельные действия для цели — не смешиваются с пошаговым маршрутом
          доп.дохода.
        </p>
      </div>
      <div className="grid gap-3">
        {options.map((option) => {
          const task = taskByTitle.get(measureKey(option.title));
          const done = task?.status === "done";
          const whyReasons = compactWhyReasons(option, 2);

          return (
            <Card key={option.title}>
              <CardHeader className="space-y-3 p-4 sm:p-5">
                <CardTitle className="text-base">{option.title}</CardTitle>
                <div className="text-sm space-y-1">
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
                {task && !done && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === task.id}
                    onClick={() => handleComplete(task.id)}
                    className="w-full sm:w-fit"
                  >
                    {loadingId === task.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="size-4" />
                        Отметить выполненным
                      </>
                    )}
                  </Button>
                )}
                {done && (
                  <p className="text-sm text-emerald-400">Мера выполнена</p>
                )}
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
