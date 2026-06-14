"use client";

import { saveProfileIncomeParameters } from "@/lib/actions/profile-income";
import { deriveBaseIncomeFromProfile } from "@/types/profile-income";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumericInput } from "@/components/ui/numeric-input";
import { parseNumberForCalc } from "@/lib/forms/numeric-field";
import { Toast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import { usesVariableIncome, type ProfileType } from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function IncomeExpectationsSettings({
  profileType,
  initialParams,
}: {
  profileType: ProfileType;
  initialParams: ProfileIncomeParameters;
}) {
  const router = useRouter();
  const [badMonth, setBadMonth] = useState(
    initialParams.badMonth ? String(initialParams.badMonth) : ""
  );
  const [goodMonth, setGoodMonth] = useState(
    initialParams.goodMonth ? String(initialParams.goodMonth) : ""
  );
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const previewBase = useMemo(() => {
    const bad = parseNumberForCalc(badMonth);
    const good = parseNumberForCalc(goodMonth);
    if (!bad || !good || good < bad) return null;
    return deriveBaseIncomeFromProfile({
      averageMonthly: null,
      badMonth: bad,
      goodMonth: good,
      storedExpectedMonthly: null,
      useActualIncomeOnly: false,
    });
  }, [badMonth, goodMonth]);

  if (!usesVariableIncome(profileType)) {
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveProfileIncomeParameters({
        badMonth: parseNumberForCalc(badMonth),
        averageMonthly: null,
        goodMonth: parseNumberForCalc(goodMonth),
        storedExpectedMonthly: initialParams.storedExpectedMonthly,
        useActualIncomeOnly: initialParams.useActualIncomeOnly,
      });
      setToastMessage("Ожидания дохода обновлены");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card id="income-expectations" className="mb-6 scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-base">Ожидания дохода</CardTitle>
          <CardDescription>
            Укажите типичный минимум и максимум в месяц. Базовый сценарий для
            прогноза рассчитается автоматически. Это не фактические поступления
            — их добавляйте в разделе «Доходы».
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave} className="px-5 pb-5 space-y-4">
          <NumericInput
            id="badMonth"
            label="Плохой месяц — минимальный доход, который обычно бывает (₽)"
            mode="decimal"
            required
            value={badMonth}
            onValueChange={setBadMonth}
            placeholder="50000"
          />
          <NumericInput
            id="goodMonth"
            label="Хороший месяц — максимальный доход, который обычно бывает (₽)"
            mode="decimal"
            required
            value={goodMonth}
            onValueChange={setGoodMonth}
            placeholder="120000"
          />
          {previewBase !== null && (
            <p className="text-sm text-muted rounded-lg border border-border/60 bg-surface-hover/30 px-3 py-2">
              Базовый сценарий:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(previewBase)}/мес
              </span>{" "}
              — среднее между плохим и хорошим месяцем
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить ожидания"
            )}
          </Button>
        </form>
      </Card>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}
