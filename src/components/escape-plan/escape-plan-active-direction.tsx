"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialTask } from "@/types/tasks";
import type { UserEscapePlan } from "@/types/escape-plan";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { completeTask } from "@/lib/actions/tasks";
import { useRouter } from "next/navigation";

interface EscapePlanActiveDirectionProps {
  activePlan: UserEscapePlan;
  steps: FinancialTask[];
}

export function EscapePlanActiveDirection({
  activePlan,
  steps,
}: EscapePlanActiveDirectionProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const pendingSteps = steps.filter((s) => s.status === "pending");

  async function handleComplete(id: string) {
    setLoadingId(id);
    try {
      await completeTask(id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader className="space-y-4">
        <div>
          <p className="text-xs text-muted mb-1">Выбранное направление</p>
          <CardTitle className="text-lg">{activePlan.option_title}</CardTitle>
          <CardDescription className="mt-1">Статус: активен</CardDescription>
        </div>

        {pendingSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Ваши шаги</p>
            <ol className="space-y-2">
              {pendingSteps.map((step, index) => (
                <li
                  key={step.id}
                  className="flex items-start justify-between gap-3 text-sm rounded-lg border border-border/50 bg-surface/50 p-3"
                >
                  <span>
                    {index + 1}. {step.title}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === step.id}
                    onClick={() => handleComplete(step.id)}
                    className="shrink-0"
                  >
                    {loadingId === step.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="size-4" />
                        Готово
                      </>
                    )}
                  </Button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <Link href="/actions">
          <Button size="sm">Все шаги в разделе «Что делать»</Button>
        </Link>
      </CardHeader>
    </Card>
  );
}
