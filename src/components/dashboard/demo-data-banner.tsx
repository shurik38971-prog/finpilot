"use client";

import { seedDemoData } from "@/lib/actions/finance";
import { notifyFinancialDataChanged } from "@/lib/finance-events";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useState } from "react";

interface DemoDataBannerProps {
  isEmpty: boolean;
  hasDemoData?: boolean;
}

export function DemoDataBanner({
  isEmpty,
  hasDemoData = false,
}: DemoDataBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSeed(force = false) {
    if (!force && !isEmpty) {
      if (!confirm("Заменить текущие данные демо-набором?")) return;
    }
    setLoading(true);
    setError("");
    try {
      await seedDemoData(force || !isEmpty);
      trackClientEvent(ANALYTICS_EVENTS.DEMO_LOADED);
      router.refresh();
      notifyFinancialDataChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  if (!isEmpty) {
    if (!hasDemoData) return null;

    return (
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleSeed(true)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Перезагрузить демо
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle className="text-base">Начните с демо-данных</CardTitle>
        <CardDescription>
          Загрузите пример для самозанятого: доходы, расходы и 3 долга —
          чтобы сразу увидеть дашборд, прогноз и сценарии в действии.
        </CardDescription>
      </CardHeader>
      <div className="px-5 pb-5 flex items-center gap-3">
        <Button onClick={() => handleSeed()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {loading ? "Загрузка..." : "Загрузить демо-данные"}
        </Button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Card>
  );
}
