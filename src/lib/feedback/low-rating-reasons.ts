export const LOW_RATING_REASONS = [
  { id: "unrealistic", label: "Нереалистично" },
  { id: "not_suitable", label: "Не подходит" },
  { id: "already_done", label: "Уже сделал" },
  { id: "unclear", label: "Непонятно" },
] as const;

export type LowRatingReasonId =
  (typeof LOW_RATING_REASONS)[number]["id"];

const REASON_LABELS = Object.fromEntries(
  LOW_RATING_REASONS.map((reason) => [reason.id, reason.label])
) as Record<LowRatingReasonId, string>;

export function lowRatingReasonLabel(
  reason: string | null | undefined
): string | null {
  if (!reason) return null;
  return REASON_LABELS[reason as LowRatingReasonId] ?? reason;
}
