"use client";

import { runAnalysis } from "@/lib/analysis/run-analysis";
import { saveWizardGoal } from "@/lib/actions/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GoalType } from "@/types/goals";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const GOAL_OPTIONS: {
  type: GoalType;
  title: string;
  defaultTarget: number;
}[] = [
  { type: "safety_cushion", title: "Подушка безопасности", defaultTarget: 150000 },
  { type: "debt_payoff", title: "Погасить долги", defaultTarget: 100000 },
  { type: "custom", title: "Накопить на цель", defaultTarget: 300000 },
];

export function GoalStep() {
  const router = useRouter();
  const [selected, setSelected] = useState(GOAL_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState(
    String(GOAL_OPTIONS[0].defaultTarget)
  );
  const [customTitle, setCustomTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"form" | "analyzing">("form");
  const [error, setError] = useState("");

  function selectGoal(option: (typeof GOAL_OPTIONS)[number]) {
    setSelected(option);
    setTargetAmount(String(option.defaultTarget));
    if (option.type !== "custom") {
      setCustomTitle("");
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const title =
      selected.type === "custom"
        ? customTitle.trim() || "Моя цель"
        : selected.title;
    const target = Number(targetAmount);

    if (!target || target <= 0) {
      setError("Укажите сумму цели");
      setLoading(false);
      return;
    }

    try {
      await saveWizardGoal({
        type: selected.type,
        title,
        targetAmount: target,
      });

      setPhase("analyzing");

      const result = await runAnalysis();
      if (!result.ok) {
        setPhase("form");
        setError(result.error || "Не удалось выполнить анализ");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setPhase("form");
      setError("Не удалось завершить настройку");
      setLoading(false);
    }
  }

  if (phase === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <div>
          <h2 className="text-xl font-semibold">Строим ваш план</h2>
          <p className="text-sm text-muted mt-1">
            ИИ-анализируем финансы и готовим рекомендации...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFinish} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Выберите цель</h2>
        <p className="text-sm text-muted mt-1">
          После этого FinPilot автоматически запустит анализ и откроет дашборд
        </p>
      </div>

      <div className="grid gap-2">
        {GOAL_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => selectGoal(option)}
            className={`rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
              selected.type === option.type
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border/70 bg-surface-hover/40 text-muted hover:text-foreground"
            }`}
          >
            {GOAL_TYPE_LABELS[option.type]}
          </button>
        ))}
      </div>

      {selected.type === "custom" && (
        <Input
          id="customTitle"
          label="Название цели"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Отпуск, машина, ремонт"
        />
      )}

      <Input
        id="targetAmount"
        label="Сумма цели (₽)"
        type="number"
        min="1"
        required
        inputMode="numeric"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Завершить и получить план
          </>
        )}
      </Button>
    </form>
  );
}
