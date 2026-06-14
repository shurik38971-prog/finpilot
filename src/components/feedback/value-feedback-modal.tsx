"use client";

import {
  dismissValueFeedback,
  submitValueFeedback,
  type ValueFeedbackAnswer,
} from "@/lib/actions/value-feedback";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ValueFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const OPTIONS: { value: ValueFeedbackAnswer; label: string }[] = [
  { value: "yes", label: "Да" },
  { value: "partial", label: "Частично" },
  { value: "no", label: "Нет" },
];

const FOLLOW_UP: Record<ValueFeedbackAnswer, string> = {
  yes: "Что оказалось самым полезным?",
  partial: "Чего не хватило?",
  no: "Что показалось непонятным или бесполезным?",
};

export function ValueFeedbackModal({ open, onClose }: ValueFeedbackModalProps) {
  const [step, setStep] = useState<"answer" | "detail">("answer");
  const [answer, setAnswer] = useState<ValueFeedbackAnswer | null>(null);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep("answer");
    setAnswer(null);
    setDetail("");
    setError("");
  }

  async function handleDismiss() {
    setLoading(true);
    try {
      await dismissValueFeedback();
      onClose();
      reset();
    } catch {
      onClose();
      reset();
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerSelect(value: ValueFeedbackAnswer) {
    setAnswer(value);
    setStep("detail");
  }

  async function handleSubmit() {
    if (!answer) return;
    setLoading(true);
    setError("");
    try {
      await submitValueFeedback({ answer, detail });
      onClose();
      reset();
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
      onClose={handleDismiss}
      title={
        step === "answer"
          ? "Удалось ли ФинПилот помочь разобраться в вашей финансовой ситуации?"
          : answer
            ? FOLLOW_UP[answer]
            : ""
      }
      className="max-w-md"
    >
      {step === "answer" && (
        <div className="space-y-4">
          <div className="space-y-2">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAnswerSelect(option.value)}
                disabled={loading}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm text-left transition-colors",
                  answer === option.value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-foreground hover:border-accent/40"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border",
                    answer === option.value
                      ? "border-accent bg-accent"
                      : "border-muted"
                  )}
                  aria-hidden
                />
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={loading}
            >
              Позже
            </Button>
          </div>
        </div>
      )}

      {step === "detail" && answer && (
        <div className="space-y-4">
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Расскажите своими словами..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("answer")}
              disabled={loading}
            >
              Назад
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? "Сохранение..." : "Отправить"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
