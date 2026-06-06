"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  INCOME_CATEGORIES,
  INCOME_TYPE_LABELS,
  type Income,
  type IncomeType,
} from "@/types/database";
import { createIncome, updateIncome } from "@/lib/actions/finance";
import { resolveIncomeType } from "@/lib/finance/income-model";
import { useState } from "react";

interface IncomeFormProps {
  income?: Income;
  onSuccess: () => void;
}

const categoryOptions = INCOME_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}));

const incomeTypeOptions = (Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map(
  (type) => ({
    value: type,
    label: INCOME_TYPE_LABELS[type],
  })
);

export function IncomeForm({ income, onSuccess }: IncomeFormProps) {
  const [loading, setLoading] = useState(false);

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
        placeholder="Проект для клиента X"
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
        id="income_type"
        name="income_type"
        label="Тип дохода"
        defaultValue={income ? resolveIncomeType(income) : "actual"}
        options={incomeTypeOptions}
      />
      <Select
        id="category"
        name="category"
        label="Категория"
        defaultValue={income?.category ?? "freelance"}
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
        Ожидаемый доход — план на месяц. Фактическое поступление — деньги, которые
        уже пришли.
      </p>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : income ? "Обновить" : "Добавить"}
      </Button>
    </form>
  );
}
