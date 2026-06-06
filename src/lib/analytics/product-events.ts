export const PRODUCT_EVENTS = {
  SIGNUP_COMPLETED: "signup_completed",
  INCOME_ADDED: "income_added",
  EXPENSE_ADDED: "expense_added",
  DEBT_ADDED: "debt_added",
  GOAL_CREATED: "goal_created",
  ANALYSIS_STARTED: "analysis_started",
  ANALYSIS_COMPLETED: "analysis_completed",
  TASK_COMPLETED: "task_completed",
  FEEDBACK_SUBMITTED: "feedback_submitted",
  DASHBOARD_OPENED: "dashboard_opened",
} as const;

export type ProductEventName =
  (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

export const PRODUCT_EVENT_SET = new Set<string>(Object.values(PRODUCT_EVENTS));
