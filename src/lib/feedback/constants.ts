export const USEFUL_FEATURES = [
  { id: "financial_health", label: "Финансовая картина" },
  { id: "goal_blockers", label: "Что мешает достигать целей" },
  { id: "main_action", label: "Главное действие" },
  { id: "plan_30_days", label: "План на 30 дней" },
  { id: "simulator", label: "Финансовый симулятор" },
  { id: "other", label: "Другое" },
] as const;

export type UsefulFeatureId = (typeof USEFUL_FEATURES)[number]["id"];

export const FEEDBACK_MESSAGE_TYPES = [
  { id: "idea" as const, label: "Есть идея", emoji: "💡" },
  { id: "bug" as const, label: "Нашёл проблему", emoji: "🐞" },
  { id: "confusion" as const, label: "Непонятно", emoji: "🤔" },
];

export const REACTIVATION_CAMPAIGN_TYPE = "reactivation_7d" as const;

export function featureLabel(id: string): string {
  return USEFUL_FEATURES.find((f) => f.id === id)?.label ?? id;
}
