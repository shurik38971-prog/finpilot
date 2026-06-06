"use client";

import { QuickFeedbackModal } from "@/components/feedback/quick-feedback-modal";
import { getQuickFeedbackEligibility } from "@/lib/actions/feedback";
import { trackAppSessionStarted } from "@/lib/analytics/client";
import { useEffect, useState } from "react";

export function QuickFeedbackPrompt() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;

    async function run() {
      await trackAppSessionStarted();
      const { shouldShow } = await getQuickFeedbackEligibility();
      if (shouldShow) setOpen(true);
      setChecked(true);
    }

    void run();
  }, [checked]);

  return (
    <QuickFeedbackModal open={open} onClose={() => setOpen(false)} />
  );
}
