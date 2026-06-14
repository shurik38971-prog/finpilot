"use client";

import { DebtFormFields } from "@/components/debts/debt-form-fields";
import { Button } from "@/components/ui/button";
import { createDebt, updateDebt } from "@/lib/actions/finance";
import type { Debt } from "@/types/database";
import { useState } from "react";

interface DebtFormProps {
  debt?: Debt;
  onSuccess: () => void;
}

export function DebtForm({ debt, onSuccess }: DebtFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const remaining = Number(formData.get("remaining_amount"));
    const term = Number(formData.get("term_months"));
    const dueDayRaw = formData.get("due_day");
    const dueDay = dueDayRaw ? Number(dueDayRaw) : null;

    if (!remaining || remaining <= 0) {
      setError("Остаток долга должен быть больше 0.");
      setLoading(false);
      return;
    }
    if (!term || term <= 0) {
      setError("Срок должен быть больше 0 месяцев.");
      setLoading(false);
      return;
    }
    if (dueDay != null && (dueDay < 1 || dueDay > 31)) {
      setError("День платежа должен быть от 1 до 31.");
      setLoading(false);
      return;
    }

    try {
      if (debt) {
        await updateDebt(debt.id, formData);
      } else {
        await createDebt(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить долг");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DebtFormFields debt={debt} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Сохранение..." : debt ? "Обновить" : "Добавить"}
      </Button>
    </form>
  );
}
