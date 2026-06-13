"use client";

import { CapabilitiesForm } from "@/components/escape-plan/capabilities-form";
import { CapabilitiesProfileSummary } from "@/components/escape-plan/capabilities-profile-summary";
import { EscapePlanResults } from "@/components/escape-plan/escape-plan-results";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useCopy } from "@/components/copy/site-copy-provider";
import { abandonActiveEscapeRoute } from "@/lib/actions/escape-plans";
import { saveUserCapabilities } from "@/lib/actions/capabilities";
import type {
  CapabilitiesFormInput,
  EscapePlanResult,
  UserCapabilities,
  UserEscapePlan,
} from "@/types/escape-plan";
import type { RescuePlan } from "@/types/rescue-plan";
import type { FinancialTask } from "@/types/tasks";
import { useRouter } from "next/navigation";
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
  hasActiveRoute?: boolean;
}

export function EscapePlanPageClient({
  initialCapabilities,
  financialSnapshot,
  initialRescuePlan = null,
  initialEscapePlans = [],
  initialPendingFollowUp = null,
  initialActivePlanTasks = [],
  hasActiveRoute = false,
}: EscapePlanPageClientProps) {
  const router = useRouter();
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [plan, setPlan] = useState<EscapePlanResult | null>(
    initialCapabilities?.last_plan ?? null
  );
  const [escapePlans, setEscapePlans] = useState(initialEscapePlans);
  const [activePlanTasks, setActivePlanTasks] = useState(initialActivePlanTasks);
  const [formExpanded, setFormExpanded] = useState(!initialCapabilities?.last_plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [pendingFormInput, setPendingFormInput] =
    useState<CapabilitiesFormInput | null>(null);

  async function runEscapePlanGeneration(input: CapabilitiesFormInput) {
    setLoading(true);
    setError("");
    try {
      const saveResult = await saveUserCapabilities(input);
      if (!saveResult.ok) {
        throw new Error(saveResult.error);
      }
      setCapabilities(saveResult.data);

      const response = await fetch("/api/escape-plan", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось сформировать план");
      }

      setPlan(data.plan);
      setFormExpanded(false);
      setEscapePlans([]);
      setActivePlanTasks([]);
      setConfirmRegenerate(false);
      setPendingFormInput(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(input: CapabilitiesFormInput) {
    if (hasActiveRoute || escapePlans.some((p) => p.status === "active")) {
      setPendingFormInput(input);
      setConfirmRegenerate(true);
      return;
    }
    await runEscapePlanGeneration(input);
  }

  async function confirmRegenerateRoute() {
    setLoading(true);
    setError("");
    try {
      await abandonActiveEscapeRoute();
      setEscapePlans([]);
      setActivePlanTasks([]);
      if (pendingFormInput) {
        await runEscapePlanGeneration(pendingFormInput);
      } else {
        setConfirmRegenerate(false);
        setPendingFormInput(null);
        setFormExpanded(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(false);
    }
  }

  const showProfileSummary = Boolean(plan && capabilities && !formExpanded);
  const pageTitle = useCopy("page.escape_plan.title");
  const pageDescription = useCopy("page.escape_plan.description");
  const surveyTitle = useCopy("escape.survey_title");
  const surveyDescription = useCopy("escape.survey_description");

  return (
    <div>
      <PageHeader title={pageTitle} description={pageDescription} />

      <Modal
        open={confirmRegenerate}
        onClose={() => {
          if (!loading) {
            setConfirmRegenerate(false);
            setPendingFormInput(null);
          }
        }}
        title="Создать новый маршрут?"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/85 leading-relaxed">
            У вас уже есть активный маршрут. Новый анализ заменит текущий
            маршрут и сбросит прогресс по старому плану. Продолжить?
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmRegenerate(false);
                setPendingFormInput(null);
              }}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={() => void confirmRegenerateRoute()} disabled={loading}>
              {loading ? "Сброс..." : "Создать новый маршрут"}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-8 max-w-2xl">
        {showProfileSummary ? (
          <CapabilitiesProfileSummary
            capabilities={capabilities!}
            onEdit={() => setFormExpanded(true)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{surveyTitle}</CardTitle>
              <CardDescription>{surveyDescription}</CardDescription>
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
            initialEscapePlans={escapePlans}
            initialPendingFollowUp={initialPendingFollowUp}
            initialActivePlanTasks={activePlanTasks}
            onRegenerate={() => {
              if (hasActiveRoute || escapePlans.some((p) => p.status === "active")) {
                setPendingFormInput(null);
                setConfirmRegenerate(true);
                return;
              }
              setFormExpanded(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
