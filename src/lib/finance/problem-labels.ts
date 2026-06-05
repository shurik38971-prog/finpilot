export const PROBLEM_LABELS = [
  "Кассовый разрыв",
  "Высокая долговая нагрузка",
  "Нестабильный доход",
  "Недостаточный резерв",
  "Высокие обязательные расходы",
  "Низкая диверсификация дохода",
] as const;

export function inferProblemLabel(threat: string): string {
  const text = threat.toLowerCase();

  if (
    text.includes("кассов") ||
    text.includes("разрыв") ||
    text.includes("отрицательн") ||
    text.includes("дефицит")
  ) {
    return "Кассовый разрыв";
  }
  if (text.includes("долг") || text.includes("кредит")) {
    return "Высокая долговая нагрузка";
  }
  if (text.includes("нестабил") || text.includes("доход")) {
    return "Нестабильный доход";
  }
  if (text.includes("резерв") || text.includes("подушк")) {
    return "Недостаточный резерв";
  }
  if (text.includes("обязательн") || text.includes("расход")) {
    return "Высокие обязательные расходы";
  }

  return threat.length > 48 ? `${threat.slice(0, 45)}…` : threat;
}

export function resolveProblemLabel(
  label: string | undefined,
  threat: string
): string {
  const trimmed = label?.trim();
  if (trimmed && PROBLEM_LABELS.includes(trimmed as (typeof PROBLEM_LABELS)[number])) {
    return trimmed;
  }
  if (trimmed && trimmed.length <= 48) {
    return trimmed;
  }
  return inferProblemLabel(threat);
}
