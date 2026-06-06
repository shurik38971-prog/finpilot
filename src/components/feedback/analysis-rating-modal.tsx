"use client";

import { submitAnalysisRating } from "@/lib/actions/ratings";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AnalysisRatingModalProps {
  open: boolean;
  onClose: () => void;
}

export function AnalysisRatingModal({ open, onClose }: AnalysisRatingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSelect(rating: number) {
    setLoading(true);
    setError("");
    try {
      await submitAnalysisRating({ rating });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить оценку"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Насколько полезен был анализ?"
      className="max-w-md"
    >
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => handleSelect(value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm transition-colors min-w-[56px]",
              "border-border text-muted hover:border-accent/40 hover:text-foreground"
            )}
            aria-label={`Оценка ${value} из 5`}
          >
            <span className="text-xl leading-none">⭐</span>
            <span className="font-medium">{value}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Позже
        </Button>
      </div>
    </Modal>
  );
}
