"use client";

import {
  dismissTaskRecommendationRating,
  submitTaskRecommendationRating,
} from "@/lib/actions/ratings";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSelect(rating: "strongly" | "slightly" | "no") {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      await submitTaskRecommendationRating({ taskId, rating });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить ответ"
      );
    } finally {
      setLoading(false);
    }
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
  }

  return (
    <Modal
      open={open}
      onClose={handleDismiss}
      title="Помогла ли рекомендация?"
      className="max-w-md"
    >
      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={loading}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm text-left transition-colors",
              "border-border text-muted hover:border-accent/40 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={loading}>
          Пропустить
        </Button>
      </div>
    </Modal>
  );
}
