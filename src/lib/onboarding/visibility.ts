export const ONBOARDING_CHECKLIST_VISIBLE_DAYS = 7;

export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

/** Чеклист на дашборде только в первые 7 дней и пока настройка не завершена. */
export function shouldShowOnboardingChecklist(
  completed: boolean,
  userCreatedAt: string | null | undefined
): boolean {
  if (completed) return false;
  if (!userCreatedAt) return true;
  return daysSince(userCreatedAt) <= ONBOARDING_CHECKLIST_VISIBLE_DAYS;
}
