/**
 * Cleanup v1: упрощённый дашборд и меньше «магических» метрик.
 * Отключить: NEXT_PUBLIC_CLEANUP_MODE=false
 */
export const CLEANUP_MODE =
  process.env.NEXT_PUBLIC_CLEANUP_MODE !== "false";

export function isCleanupMode(): boolean {
  return CLEANUP_MODE;
}
