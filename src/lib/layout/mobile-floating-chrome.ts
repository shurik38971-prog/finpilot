/** Paths where floating help / scroll controls should stay hidden on mobile. */
const MOBILE_HIDE_FLOATING_PATH_PREFIXES = [
  "/settings",
  "/escape-plan",
  "/actions",
  "/onboarding",
  "/income",
  "/expenses",
  "/debts",
  "/goals",
] as const;

export function shouldHideMobileFloatingChrome(pathname: string): boolean {
  return MOBILE_HIDE_FLOATING_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
