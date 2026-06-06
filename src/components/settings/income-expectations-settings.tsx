"use client";

import { saveProfileIncomeParameters } from "@/lib/actions/profile-income";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import { usesVariableIncome, type ProfileType } from "@/types/profile";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [averageMonth, setAverageMonth] = useState(
    initialParams.averageMonthly ? String(initialParams.averageMonthly) : ""
  );
  const [goodMonth, setGoodMonth] = useState(
    initialParams.goodMonth ? String(initialParams.goodMonth) : ""
  );
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!usesVariableIncome(profileType)) {
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveProfileIncomeParameters({
        badMonth: Number(badMonth),
        averageMonthly: Number(averageMonth),
        goodMonth: Number(goodMonth),
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
            Плановые сценарии для прогноза и анализа. Это не фактические
            поступления — их добавляйте в разделе «Доходы».
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave} className="px-5 pb-5 space-y-4">
          <Input
            id="badMonth"
            label="Сколько обычно получается в плохой месяц? (₽)"
            type="number"
            min="0"
            required
            value={badMonth}
            onChange={(e) => setBadMonth(e.target.value)}
            placeholder="50000"
          />
          <Input
            id="averageMonth"
            label="Сколько обычно получается в средний месяц? (₽)"
            type="number"
            min="1"
            required
            value={averageMonth}
            onChange={(e) => setAverageMonth(e.target.value)}
            placeholder="80000"
          />
          <Input
            id="goodMonth"
            label="Сколько обычно получается в хороший месяц? (₽)"
            type="number"
            min="1"
            required
            value={goodMonth}
            onChange={(e) => setGoodMonth(e.target.value)}
            placeholder="120000"
          />
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
