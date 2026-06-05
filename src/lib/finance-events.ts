export const FINPILOT_DATA_CHANGED = "finpilot:data-changed";

/** Уведомляет открытый дашборд о том, что финансовые данные изменились. */
export function notifyFinancialDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FINPILOT_DATA_CHANGED));
  }
}
