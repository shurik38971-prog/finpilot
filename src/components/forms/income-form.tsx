"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INCOME_CATEGORIES, type Income } from "@/types/database";
import { createIncome, updateIncome } from "@/lib/actions/finance";
import { useState } from "react";

interface IncomeFormProps {
  income?: Income;
  onSuccess: () => void;
}

const categoryOptions = INCOME_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}));

const periodOptions = [
  { value: "monthly", label: "Каждый месяц" },
  { value: "once", label: "Разово" },
];

export function IncomeForm({ income, onSuccess }: IncomeFormProps) {
  const [loading, setLoading] = useState(false);
  const defaultPeriod =
    income?.is_recurring && income.frequency ? "monthly" : "once";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (income) {
        await updateIncome(income.id, formData);
      } else {
        await createIncome(formData);
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
        defaultValue={income?.title}
        required
        placeholder="Подработка, аренда, премия"
      />
      <Input
        id="amount"
        name="amount"
        label="Сумма (₽)"
        type="number"
        min="0"
        step="0.01"
        defaultValue={income?.amount}
        required
      />
      <Select
        id="period"
        name="period"
        label="Как часто приходит"
        defaultValue={defaultPeriod}
        options={periodOptions}
      />
      <Select
        id="category"
        name="category"
        label="Категория"
        defaultValue={income?.category ?? "other"}
        options={categoryOptions}
      />
      <Input
        id="date"
        name="date"
        label="Дата"
        type="date"
        defaultValue={income?.date ?? new Date().toISOString().split("T")[0]}
        required
      />
      <p className="text-xs text-muted leading-relaxed">
        Основной доход (зарплата, пенсия и т.д.) настраивается в финансовом
        профиле. Здесь — только дополнительные поступления.
      </p>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : income ? "Обновить" : "Добавить"}
      </Button>
    </form>
  );
}
