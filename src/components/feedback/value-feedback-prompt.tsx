"use client";

import { ValueFeedbackModal } from "@/components/feedback/value-feedback-modal";
import { getValueFeedbackEligibility } from "@/lib/actions/value-feedback";
import {
  dismissValueFeedbackForSession,
  isValueFeedbackDismissedForSession,
} from "@/lib/feedback/value-feedback-client";
import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 60_000;

export function ValueFeedbackPrompt({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    async function checkEligibility() {
      if (isValueFeedbackDismissedForSession()) return;

      const { shouldShow } = await getValueFeedbackEligibility();
      if (shouldShow) setOpen(true);
    }

    void checkEligibility();

    const interval = window.setInterval(() => {
      if (open || isValueFeedbackDismissedForSession()) return;
      void checkEligibility();
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [open]);

  function handleClose() {
    dismissValueFeedbackForSession();
    setOpen(false);
  }

  return <ValueFeedbackModal open={open} onClose={handleClose} />;
}
