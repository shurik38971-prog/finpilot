"use client";

import { CapabilitiesForm } from "@/components/escape-plan/capabilities-form";
import { CapabilitiesProfileSummary } from "@/components/escape-plan/capabilities-profile-summary";
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
import type { RescuePlan } from "@/types/rescue-plan";
import type { FinancialTask } from "@/types/tasks";
import { useState } from "react";

interface EscapePlanPageClientProps {
  initialCapabilities: UserCapabilities | null;
  financialSnapshot: {
    monthlyIncome: number;
    netCashFlow: number;
    totalDebt: number;
  };
  initialRescuePlan?: RescuePlan | null;
  initialEscapePlans?: UserEscapePlan[];
  initialPendingFollowUp?: UserEscapePlan | null;
  initialActivePlanTasks?: FinancialTask[];
}

export function EscapePlanPageClient({
  initialCapabilities,
  financialSnapshot,
  initialRescuePlan = null,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
  initialActivePlanTasks = [],
}: EscapePlanPageClientProps) {
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [plan, setPlan] = useState<EscapePlanResult | null>(
    initialCapabilities?.last_plan ?? null
  );
  const [formExpanded, setFormExpanded] = useState(!initialCapabilities?.last_plan);
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
      setFormExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const showProfileSummary = Boolean(plan && capabilities && !formExpanded);

  return (
    <div>
      <PageHeader
        title="Выход из ситуации"
        description="Где вы сейчас, что мешает и что делать дальше — без лишних цифр"
      />

      <div className="space-y-8 max-w-2xl">
        {showProfileSummary ? (
          <CapabilitiesProfileSummary
            capabilities={capabilities!}
            onEdit={() => setFormExpanded(true)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Анкета возможностей</CardTitle>
              <CardDescription>
                Ответьте на вопросы — подберём варианты под вашу ситуацию
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
        )}

        {plan && capabilities && (
          <EscapePlanResults
            plan={plan}
            capabilities={capabilities}
            financialSnapshot={financialSnapshot}
            initialRescuePlan={initialRescuePlan}
            initialEscapePlans={initialEscapePlans}
            initialPendingFollowUp={initialPendingFollowUp}
            initialActivePlanTasks={initialActivePlanTasks}
            onRegenerate={() => setFormExpanded(true)}
          />
        )}
      </div>
    </div>
  );
}
