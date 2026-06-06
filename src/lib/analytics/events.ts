export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  FIRST_CLICK: "first_click",
  NAV_CLICK: "nav_click",
  BUTTON_CLICK: "button_click",
  ANALYZE_STARTED: "analyze_started",
  ANALYZE_COMPLETED: "analyze_completed",
  ANALYZE_FAILED: "analyze_failed",
  TASK_COMPLETED: "task_completed",
  HELP_OPENED: "help_opened",
  DEMO_LOADED: "demo_loaded",
  SIGNUP: "signup_completed",
  LOGIN: "login_completed",
  APP_SESSION_STARTED: "app_session_started",
  FEEDBACK_SENT: "feedback_sent",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsEventPayload {
  event_name: AnalyticsEventName | string;
  session_id: string;
  page_path?: string;
  element_id?: string;
  properties?: Record<string, unknown>;
}
