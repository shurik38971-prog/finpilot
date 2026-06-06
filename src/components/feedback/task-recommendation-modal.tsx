"use client";

import {
  dismissTaskRecommendationRating,
  submitTaskRecommendationRating,
} from "@/lib/actions/ratings";
import {
  LOW_RATING_REASONS,
  type LowRatingReasonId,
} from "@/lib/feedback/low-rating-reasons";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TaskRecommendationModalProps {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
}

const OPTIONS = [
  { value: "strongly" as const, label: "Да, сильно" },
  { value: "slightly" as const, label: "Немного" },
  { value: "no" as const, label: "Нет" },
];

export function TaskRecommendationModal({
  open,
  taskId,
  onClose,
}: TaskRecommendationModalProps) {
  const [step, setStep] = useState<"rating" | "reason">("rating");
  const [selectedRating, setSelectedRating] =
    useState<"strongly" | "slightly" | "no" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setStep("rating");
    setSelectedRating(null);
    setError("");
  }

  async function submit(
    rating: "strongly" | "slightly" | "no",
    lowRatingReason?: LowRatingReasonId | null
  ) {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      await submitTaskRecommendationRating({
        taskId,
        rating,
        lowRatingReason,
      });
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

  async function handleRatingSelect(rating: "strongly" | "slightly" | "no") {
    setSelectedRating(rating);
    if (rating === "strongly") {
      await submit(rating);
      return;
    }
    setStep("reason");
  }

  async function handleReasonSelect(reason: LowRatingReasonId) {
    if (!selectedRating || selectedRating === "strongly") return;
    await submit(selectedRating, reason);
  }

  async function handleDismiss() {
    if (taskId) {
      try {
        await dismissTaskRecommendationRating(taskId);
      } catch {
        /* ignore */
      }
    }
    onClose();
    reset();
  }

  return (
    <Modal
      open={open}
      onClose={handleDismiss}
      title={
        step === "rating"
          ? "Помогла ли рекомендация?"
          : "Почему рекомендация не помогла?"
      }
      className="max-w-md"
    >
      {step === "rating" && (
        <div className="space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={loading}
              onClick={() => handleRatingSelect(option.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
                "border-border text-muted hover:border-accent/40 hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {step === "reason" && (
        <div className="space-y-2">
          {LOW_RATING_REASONS.map((reason) => (
            <button
              key={reason.id}
              type="button"
              disabled={loading}
              onClick={() => handleReasonSelect(reason.id)}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
                "border-border text-muted hover:border-accent/40 hover:text-foreground"
              )}
            >
              {reason.label}
            </button>
          ))}
          {selectedRating === "slightly" && (
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => submit("slightly")}
              >
                Пропустить причину
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      <div className="flex justify-between mt-4">
        {step === "reason" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("rating")}
            disabled={loading}
          >
            Назад
          </Button>
        ) : (
          <span />
        )}
        <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={loading}>
          Пропустить
        </Button>
      </div>
    </Modal>
  );
}
