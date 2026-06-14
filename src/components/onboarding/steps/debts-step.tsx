"use client";

import { saveWizardDebt, skipWizardDebts } from "@/lib/actions/onboarding-wizard";
import { DebtFormFields } from "@/components/debts/debt-form-fields";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function DebtsStep({ onComplete }: { onComplete: () => void }) {
  const [hasDebt, setHasDebt] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSkip() {
    setLoading(true);
    setError("");
    try {
      await skipWizardDebts();
      onComplete();
    } catch {
      setError("Не удалось продолжить");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    const remaining = Number(formData.get("remaining_amount"));
    const term = Number(formData.get("term_months"));
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

    try {
      await saveWizardDebt(formData);
      onComplete();
    } catch {
      setError("Не удалось сохранить долг");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Есть долги?</h2>
        <p className="text-sm text-muted mt-1">
          Укажите остаток, ставку и срок — ФинПилот рассчитает примерный платёж
        </p>
      </div>

      {hasDebt === null && (
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full h-12"
            onClick={() => setHasDebt(true)}
          >
            Да, есть долги
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full h-12"
            onClick={() => setHasDebt(false)}
          >
            Нет долгов
          </Button>
        </div>
      )}

      {hasDebt === false && (
        <div className="space-y-3">
          <p className="text-sm text-muted">Отлично — переходим к цели</p>
          <Button
            type="button"
            className="w-full h-12"
            disabled={loading}
            onClick={handleSkip}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </div>
      )}

      {hasDebt === true && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <DebtFormFields />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
          </Button>
        </form>
      )}

      {hasDebt === null && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
