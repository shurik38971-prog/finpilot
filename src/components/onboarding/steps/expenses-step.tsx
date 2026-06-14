"use client";

import { saveWizardExpenses } from "@/lib/actions/onboarding-wizard";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const MANDATORY_EXPENSE_PRESETS = [
  {
    key: "housing",
    title: "Жильё / аренда",
    category: "housing",
    placeholder: "35000",
  },
  { key: "food", title: "Продукты", category: "food", placeholder: "20000" },
  {
    key: "transport",
    title: "Транспорт",
    category: "transport",
    placeholder: "8000",
  },
  {
    key: "utilities",
    title: "Коммунальные",
    category: "utilities",
    placeholder: "6000",
  },
] as const;

const OPTIONAL_EXPENSE_PRESETS = [
  {
    key: "subscriptions",
    title: "Подписки",
    category: "subscriptions",
    placeholder: "3000",
    hint: "Spotify, Netflix, VPN и другие — необязательные траты",
  },
] as const;

export function ExpensesStep({ onComplete }: { onComplete: () => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateAmount(key: string, value: string) {
    setAmounts((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const allPresets = [...MANDATORY_EXPENSE_PRESETS, ...OPTIONAL_EXPENSE_PRESETS];
    const items = allPresets
      .map((preset) => ({
        title: preset.title,
        category: preset.category,
        amount: Number(amounts[preset.key] || 0),
        is_essential: preset.category !== "subscriptions",
      }))
      .filter((item) => item.amount > 0);

    if (items.length === 0) {
      setError("Укажите хотя бы один расход");
      setLoading(false);
      return;
    }

    try {
      await saveWizardExpenses(items);
      onComplete();
    } catch {
      setError("Не удалось сохранить расходы");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Основные расходы</h2>
        <p className="text-sm text-muted mt-1">
          Укажите примерные суммы в месяц. Пустые поля можно пропустить.
        </p>
      </div>

      <div className="space-y-3">
        {MANDATORY_EXPENSE_PRESETS.map((preset) => (
          <NumericInput
            key={preset.key}
            id={preset.key}
            label={preset.title}
            mode="integer"
            placeholder={preset.placeholder}
            value={amounts[preset.key] ?? ""}
            onValueChange={(value) => updateAmount(preset.key, value)}
          />
        ))}
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <div>
          <h3 className="text-sm font-medium">Необязательные расходы</h3>
          <p className="text-xs text-muted mt-1">
            Подписки и сервисы — их можно сократить при необходимости
          </p>
        </div>
        {OPTIONAL_EXPENSE_PRESETS.map((preset) => (
          <NumericInput
            key={preset.key}
            id={preset.key}
            label={preset.title}
            mode="integer"
            placeholder={preset.placeholder}
            value={amounts[preset.key] ?? ""}
            onValueChange={(value) => updateAmount(preset.key, value)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full h-12" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Далее"}
      </Button>
    </form>
  );
}
