import { clearPostAnalysisEngagement } from "@/lib/feedback/post-analysis-engagement";

export const VALUE_FEEDBACK_SESSION_DISMISS_KEY =
  "finpilot:value_feedback_dismissed_session";

export function isValueFeedbackDismissedForSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(VALUE_FEEDBACK_SESSION_DISMISS_KEY) === "1";
}

export function dismissValueFeedbackForSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VALUE_FEEDBACK_SESSION_DISMISS_KEY, "1");
}

export function clearValueFeedbackClientState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(VALUE_FEEDBACK_SESSION_DISMISS_KEY);
  clearPostAnalysisEngagement();
}
