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
import { Input } from "@/components/ui/input";
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
    const bad = Number(badMonth);
    const good = Number(goodMonth);
    if (!bad || !good || good < bad) return null;
    return deriveBaseIncomeFromProfile({
      averageMonthly: null,
      badMonth: bad,
      goodMonth: good,
      storedExpectedMonthly: null,
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
        badMonth: Number(badMonth),
        averageMonthly: null,
        goodMonth: Number(goodMonth),
        storedExpectedMonthly: initialParams.storedExpectedMonthly,
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
          <Input
            id="badMonth"
            label="Плохой месяц — минимальный доход, который обычно бывает (₽)"
            type="number"
            min="0"
            required
            value={badMonth}
            onChange={(e) => setBadMonth(e.target.value)}
            placeholder="50000"
          />
          <Input
            id="goodMonth"
            label="Хороший месяц — максимальный доход, который обычно бывает (₽)"
            type="number"
            min="1"
            required
            value={goodMonth}
            onChange={(e) => setGoodMonth(e.target.value)}
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
