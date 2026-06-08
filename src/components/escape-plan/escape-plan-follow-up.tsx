"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { answerEscapeFollowUp } from "@/lib/actions/escape-plans";
import type {
  EscapeFollowUpAnswer,
  EscapePlanResult,
  UserEscapePlan,
} from "@/types/escape-plan";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface EscapePlanFollowUpProps {
  pending: UserEscapePlan;
  plan: EscapePlanResult;
  onAnswered: (updated: UserEscapePlan) => void;
}

export function EscapePlanFollowUp({
  pending,
  plan,
  onAnswered,
}: EscapePlanFollowUpProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnswer(answer: EscapeFollowUpAnswer) {
    setLoading(true);
    setError("");
    try {
      const updated = await answerEscapeFollowUp(pending.id, answer);
      onAnswered(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const snapshot = pending.option_snapshot;
  const nextPlanStep = plan.plan_7_days[1] ?? plan.plan_7_days[0];

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-base">Проверка прогресса</CardTitle>
          <CardDescription className="mt-1">
            Неделю назад вы выбрали: <strong>{pending.option_title}</strong>
          </CardDescription>
        </div>

        {!pending.follow_up_answer && (
          <>
            <p className="text-sm font-medium">Удалось продвинуться?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={loading}
                onClick={() => handleAnswer("yes")}
              >
                Да
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => handleAnswer("partial")}
              >
                Частично
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => handleAnswer("no")}
              >
                Нет
              </Button>
              {loading && <Loader2 className="size-4 animate-spin text-muted" />}
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {pending.follow_up_answer === "yes" && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm space-y-1">
            <p className="font-medium text-emerald-400">Отлично — продолжайте.</p>
            <p>
              Следующий шаг: {nextPlanStep ?? snapshot?.first_step ?? "закрепите результат и зафиксируйте прогресс в FinPilot"}
            </p>
          </div>
        )}

        {pending.follow_up_answer === "partial" && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm space-y-1">
            <p className="font-medium">Это нормально — главное, что движение есть.</p>
            <p>
              Повторите первый шаг или уточните его:{" "}
              {snapshot?.first_step ?? "вернитесь к плану на 7 дней"}
            </p>
          </div>
        )}

        {pending.follow_up_answer === "no" && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm space-y-1">
            <p className="font-medium">Этот путь не сработал — попробуйте другой вариант ниже.</p>
            <p className="text-muted">
              Выберите направление с более высокой уверенностью или меньшим порогом входа.
            </p>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
