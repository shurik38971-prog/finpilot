/**
 * Cleanup v1/v2: навигатор действий вместо финансовой аналитики.
 * Отключить: NEXT_PUBLIC_CLEANUP_MODE=false
 */
export const CLEANUP_MODE =
  process.env.NEXT_PUBLIC_CLEANUP_MODE !== "false";

/** Скрыты в боковом меню при cleanup mode (маршруты остаются в коде) */
export const CLEANUP_HIDDEN_NAV_PATHS = [
  "/crisis",
  "/scenarios",
  "/simulator",
  "/analyze",
  "/history",
] as const;

export function isCleanupMode(): boolean {
  return CLEANUP_MODE;
}

export function isNavHiddenInCleanup(href: string): boolean {
  if (!CLEANUP_MODE) return false;
  return (CLEANUP_HIDDEN_NAV_PATHS as readonly string[]).includes(href);
}
