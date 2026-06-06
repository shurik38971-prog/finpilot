"use client";

import { saveWizardDebt, skipWizardDebts } from "@/lib/actions/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    const form = new FormData(e.currentTarget);
    try {
      await saveWizardDebt({
        title: String(form.get("title")),
        remainingAmount: Number(form.get("remaining")),
        minimumPayment: Number(form.get("payment")),
      });
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
          Кредиты, ипотека, рассрочки — это поможет точнее построить план
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
          <Input
            id="title"
            name="title"
            label="Название"
            required
            placeholder="Ипотека"
          />
          <Input
            id="remaining"
            name="remaining"
            label="Остаток долга (₽)"
            type="number"
            min="1"
            required
            placeholder="1500000"
          />
          <Input
            id="payment"
            name="payment"
            label="Ежемесячный платёж (₽)"
            type="number"
            min="0"
            required
            placeholder="25000"
          />
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
