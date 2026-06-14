"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select } from "@/components/ui/select";
import { numberToFieldValue } from "@/lib/forms/numeric-field";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
} from "@/types/database";
import { createExpense, updateExpense } from "@/lib/actions/finance";
import { useState } from "react";

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
}

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABELS[c],
}));

const frequencyOptions = [
  { value: "weekly", label: "Еженедельно" },
  { value: "monthly", label: "Ежемесячно" },
  { value: "quarterly", label: "Ежеквартально" },
  { value: "yearly", label: "Ежегодно" },
];

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const [isRecurring, setIsRecurring] = useState(expense?.is_recurring ?? false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(numberToFieldValue(expense?.amount));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (expense) {
        await updateExpense(expense.id, formData);
      } else {
        await createExpense(formData);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="title"
        name="title"
        label="Название"
        defaultValue={expense?.title}
        required
        placeholder="Аренда квартиры"
      />
      <NumericInput
        id="amount"
        name="amount"
        label="Сумма (₽)"
        mode="decimal"
        value={amount}
        onValueChange={setAmount}
        required
        placeholder="15000"
      />
      <Select
        id="category"
        name="category"
        label="Категория"
        defaultValue={expense?.category ?? "other"}
        options={categoryOptions}
      />
      <Input
        id="date"
        name="date"
        label="Дата"
        type="date"
        defaultValue={expense?.date ?? new Date().toISOString().split("T")[0]}
        required
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_recurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="rounded border-border"
        />
        Повторяющийся расход
      </label>
      {isRecurring && (
        <Select
          id="frequency"
          name="frequency"
          label="Частота"
          defaultValue={expense?.frequency ?? "monthly"}
          options={frequencyOptions}
        />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_essential"
          defaultChecked={expense?.is_essential}
          className="rounded border-border"
        />
        Обязательный расход
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : expense ? "Обновить" : "Добавить"}
      </Button>
    </form>
  );
}
