"use client";

import { Button } from "@/components/ui/button";
import { reportAttemptFailure } from "@/lib/actions/escape-plans";
import {
  ESCAPE_FAILURE_REASONS,
  type EscapeFailureReason,
} from "@/types/rescue-plan";
import type { UserEscapePlan } from "@/types/escape-plan";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface EscapePlanFailureFeedbackProps {
  planId: string;
  onReported: (updated: UserEscapePlan) => void;
}

export function EscapePlanFailureFeedback({
  planId,
  onReported,
}: EscapePlanFailureFeedbackProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otherText, setOtherText] = useState("");
  const [showOther, setShowOther] = useState(false);

  async function submit(reason: EscapeFailureReason) {
    if (reason === "other" && !otherText.trim()) {
      setShowOther(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const updated = await reportAttemptFailure(
        planId,
        reason,
        reason === "other" ? otherText : undefined
      );
      onReported(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Что помешало?</p>
      <div className="flex flex-wrap gap-2">
        {ESCAPE_FAILURE_REASONS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={item.value === "other" && showOther ? "secondary" : "ghost"}
            disabled={loading}
            onClick={() => {
              if (item.value === "other") {
                setShowOther(true);
                if (otherText.trim()) submit("other");
              } else {
                submit(item.value);
              }
            }}
          >
            {item.label}
          </Button>
        ))}
        {loading && <Loader2 className="size-4 animate-spin text-muted" />}
      </div>

      {showOther && (
        <div className="space-y-2">
          <textarea
            className="w-full min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Кратко опишите, что помешало"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
          />
          <Button
            size="sm"
            disabled={loading || !otherText.trim()}
            onClick={() => submit("other")}
          >
            Отправить
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
