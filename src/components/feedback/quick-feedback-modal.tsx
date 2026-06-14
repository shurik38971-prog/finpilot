"use client";

import {
  dismissQuickFeedback,
  submitQuickFeedback,
} from "@/lib/actions/feedback";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuickFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function QuickFeedbackModal({ open, onClose }: QuickFeedbackModalProps) {
  const [step, setStep] = useState<"rating" | "text">("rating");
  const [rating, setRating] = useState<number | null>(null);
  const [usefulText, setUsefulText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep("rating");
    setRating(null);
    setUsefulText("");
    setError("");
  }

  async function handleDismiss() {
    setLoading(true);
    try {
      await dismissQuickFeedback();
      onClose();
      reset();
    } catch {
      onClose();
      reset();
    } finally {
      setLoading(false);
    }
  }

  function handleRatingSelect(value: number) {
    setRating(value);
    setStep("text");
  }

  async function handleSubmit() {
    if (rating == null) return;
    setLoading(true);
    setError("");
    try {
      await submitQuickFeedback({ rating, usefulText });
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
        step === "rating"
          ? "Насколько полезен ФинПилот?"
          : "Что было самым полезным?"
      }
      className="max-w-md"
    >
      {step === "rating" && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingSelect(value)}
                disabled={loading}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm transition-colors min-w-[56px]",
                  rating === value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                )}
                aria-label={`Оценка ${value} из 5`}
              >
                <span className="text-xl leading-none">⭐</span>
                <span className="font-medium">{value}</span>
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

      {step === "text" && (
        <div className="space-y-4">
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Например: прогноз кэша, цели, AI-анализ..."
            value={usefulText}
            onChange={(e) => setUsefulText(e.target.value)}
            maxLength={2000}
            autoFocus
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("rating")}
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
