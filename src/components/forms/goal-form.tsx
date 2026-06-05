"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import type { Debt } from "@/types/database";
import type { FinancialGoal, GoalType } from "@/types/goals";
import { GOAL_TYPE_LABELS } from "@/types/goals";
import { useState } from "react";

interface GoalFormProps {
  goal?: FinancialGoal;
  debts?: Debt[];
  onSuccess: () => void;
}

const typeOptions = Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function GoalForm({ goal, debts = [], onSuccess }: GoalFormProps) {
  const [type, setType] = useState<GoalType>(goal?.type ?? "safety_cushion");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (goal) {
        await updateGoal(goal.id, formData);
      } else {
        await createGoal(formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const suggestedTitle =
    type === "safety_cushion" ? "Подушка безопасности" : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!goal && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="type" className="block text-sm text-muted">
              Тип цели
            </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          </div>
          {type === "debt_payoff" && debts.length > 0 && (
            <Select
              id="debt_id"
              name="debt_id"
              label="Долг"
              options={debts.map((d) => ({
                value: d.id,
                label: `${d.title} (остаток ${d.remaining_amount} ₽)`,
              }))}
            />
          )}
        </>
      )}
      <Input
        id="title"
        name="title"
        label="Название"
        defaultValue={goal?.title ?? suggestedTitle}
        key={goal ? goal.id : type}
        required
        placeholder="Подушка безопасности"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="target_amount"
          name="target_amount"
          label="Цель (₽)"
          type="number"
          min="1"
          step="0.01"
          defaultValue={goal?.target_amount}
          required
        />
        <Input
          id="current_amount"
          name="current_amount"
          label="Текущий прогресс (₽)"
          type="number"
          min="0"
          step="0.01"
          defaultValue={goal?.current_amount ?? 0}
          required
        />
      </div>
      <Input
        id="deadline"
        name="deadline"
        label="Дедлайн (необязательно)"
        type="date"
        defaultValue={goal?.deadline ?? undefined}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : goal ? "Обновить" : "Создать цель"}
      </Button>
    </form>
  );
}
