"use client";

import { ValueFeedbackModal } from "@/components/feedback/value-feedback-modal";
import { getValueFeedbackEligibility } from "@/lib/actions/value-feedback";
import { trackAppSessionStarted } from "@/lib/analytics/client";
import {
  getPostAnalysisEngagementMinutes,
  tickPostAnalysisEngagement,
} from "@/lib/feedback/post-analysis-engagement";
import { useEffect, useState } from "react";

const SESSION_DISMISS_KEY = "finpilot:value_feedback_dismissed_session";
const CHECK_INTERVAL_MS = 60_000;

export function ValueFeedbackPrompt({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (checked) return;

    async function checkEligibility() {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY)) return;

      const { shouldShow } = await getValueFeedbackEligibility({
        clientEngagementMinutes: getPostAnalysisEngagementMinutes(),
      });

      if (shouldShow) setOpen(true);
    }

    async function run() {
      await trackAppSessionStarted();
      await checkEligibility();
      setChecked(true);
    }

    void run();
  }, [checked]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      tickPostAnalysisEngagement();
      if (open || sessionStorage.getItem(SESSION_DISMISS_KEY)) return;

      void getValueFeedbackEligibility({
        clientEngagementMinutes: getPostAnalysisEngagementMinutes(),
      }).then(({ shouldShow }) => {
        if (shouldShow) setOpen(true);
      });
    }, CHECK_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        tickPostAnalysisEngagement();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [open]);

  function handleClose() {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    setOpen(false);
  }

  return <ValueFeedbackModal open={open} onClose={handleClose} />;
}
