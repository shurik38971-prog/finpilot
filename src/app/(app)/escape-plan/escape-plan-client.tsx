"use client";

import { CapabilitiesForm } from "@/components/escape-plan/capabilities-form";
import { EscapePlanResults } from "@/components/escape-plan/escape-plan-results";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveUserCapabilities } from "@/lib/actions/capabilities";
import type {
  CapabilitiesFormInput,
  EscapePlanResult,
  UserCapabilities,
  UserEscapePlan,
} from "@/types/escape-plan";
import { useState } from "react";

interface EscapePlanPageClientProps {
  initialCapabilities: UserCapabilities | null;
  initialEscapePlans?: UserEscapePlan[];
  initialPendingFollowUp?: UserEscapePlan | null;
}

export function EscapePlanPageClient({
  initialCapabilities,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
}: EscapePlanPageClientProps) {
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [plan, setPlan] = useState<EscapePlanResult | null>(
    initialCapabilities?.last_plan ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(input: CapabilitiesFormInput) {
    setLoading(true);
    setError("");
    try {
      const saved = await saveUserCapabilities(input);
      setCapabilities(saved);

      const response = await fetch("/api/escape-plan", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось сформировать план");
      }

      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Поиск выхода"
        description="Реалистичные варианты с учётом ваших навыков, времени и ограничений"
      />

      <div className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Анкета возможностей</CardTitle>
            <CardDescription>
              Ответьте на вопросы — подберём варианты под вашу ситуацию, а не общие советы
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <CapabilitiesForm
              initial={capabilities}
              loading={loading}
              onSubmit={handleSubmit}
            />
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          </div>
        </Card>

        {plan && (
          <EscapePlanResults
            plan={plan}
            capabilities={capabilities}
            initialEscapePlans={initialEscapePlans}
            initialPendingFollowUp={initialPendingFollowUp}
          />
        )}
      </div>
    </div>
  );
}
