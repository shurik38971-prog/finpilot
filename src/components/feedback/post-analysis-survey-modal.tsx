"use client";

import { submitProductFeedback } from "@/lib/actions/feedback";
import {
  type UsefulFeatureId,
  USEFUL_FEATURES,
} from "@/lib/feedback/constants";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PostAnalysisSurveyModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  "Что оказалось самым полезным?",
  "После анализа вы сделали какое-нибудь действие?",
  "Что было непонятно?",
  "Какой функции вам не хватает больше всего?",
  "Если бы ФинПилот завтра перестал работать, что бы вы потеряли?",
] as const;

export function PostAnalysisSurveyModal({
  open,
  onClose,
  onComplete,
}: PostAnalysisSurveyModalProps) {
  const [step, setStep] = useState(0);
  const [feature, setFeature] = useState<UsefulFeatureId | null>(null);
  const [tookAction, setTookAction] = useState<boolean | null>(null);
  const [actionDescription, setActionDescription] = useState("");
  const [confusion, setConfusion] = useState("");
  const [missingFeature, setMissingFeature] = useState("");
  const [lostValue, setLostValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep(0);
    setFeature(null);
    setTookAction(null);
    setActionDescription("");
    setConfusion("");
    setMissingFeature("");
    setLostValue("");
    setError("");
  }

  function handleClose() {
    onClose();
    reset();
  }

  function canNext() {
    if (step === 0) return feature !== null;
    if (step === 1) {
      if (tookAction === null) return false;
      if (tookAction) return actionDescription.trim().length >= 2;
      return true;
    }
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return lostValue.trim().length >= 2;
    return false;
  }

  async function handleSubmit() {
    if (!feature || tookAction === null || lostValue.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      await submitProductFeedback({
        most_useful_feature: feature,
        took_action: tookAction,
        action_description: actionDescription,
        confusion_text: confusion,
        missing_feature: missingFeature,
        lost_value_text: lostValue,
      });
      onComplete();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить ответ"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Помогите сделать ФинПилот полезнее"
      className="max-w-md"
    >
      <p className="text-xs text-muted mb-4">
        Шаг {step + 1} из {STEPS.length}
      </p>
      <h3 className="text-sm font-medium mb-4">{STEPS[step]}</h3>

      {step === 0 && (
        <div className="space-y-2">
          {USEFUL_FEATURES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFeature(id)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors",
                feature === id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:border-accent/40 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: "Да" },
              { value: false, label: "Нет" },
            ].map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setTookAction(value)}
                className={cn(
                  "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                  tookAction === value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted hover:border-accent/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {tookAction && (
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Что именно вы сделали?"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              maxLength={2000}
            />
          )}
        </div>
      )}

      {step === 2 && (
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Необязательно — напишите, если что-то смутило"
          value={confusion}
          onChange={(e) => setConfusion(e.target.value)}
          maxLength={2000}
        />
      )}

      {step === 3 && (
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Например: напоминания, интеграция с банком, совместный доступ..."
          value={missingFeature}
          onChange={(e) => setMissingFeature(e.target.value)}
          maxLength={2000}
        />
      )}

      {step === 4 && (
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Опишите, что для вас важнее всего в сервисе"
          value={lostValue}
          onChange={(e) => setLostValue(e.target.value)}
          maxLength={2000}
        />
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

      <div className="flex justify-between gap-2 mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step > 0 ? setStep((s) => s - 1) : handleClose())}
          disabled={loading}
        >
          {step > 0 ? "Назад" : "Позже"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
          >
            Далее
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canNext() || loading}
          >
            {loading ? "Сохранение..." : "Отправить"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
