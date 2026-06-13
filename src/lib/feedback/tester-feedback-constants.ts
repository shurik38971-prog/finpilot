export const TESTER_CLARITY_OPTIONS = ["Да", "Частично", "Нет"] as const;

export const TESTER_USEFUL_PARTS_OPTIONS = [
  "Увидеть расходы",
  "Понять, сколько не хватает до цели",
  "Идеи доп.дохода",
  "Общий план действий",
  "Другое",
] as const;

export const TESTER_PAID_VALUE_OPTIONS = [
  "Подробный финансовый маршрут",
  "Идеи доп.дохода под навыки",
  "Ежемесячный пересчёт",
  "Персональная настройка",
  "Пока ни за что",
  "Другое",
] as const;

export type TesterClarity = (typeof TESTER_CLARITY_OPTIONS)[number];
export type TesterUsefulPart = (typeof TESTER_USEFUL_PARTS_OPTIONS)[number];
export type TesterPaidValuePart = (typeof TESTER_PAID_VALUE_OPTIONS)[number];

export interface TesterFeedbackPayload {
  clarity: TesterClarity;
  useful_parts: TesterUsefulPart[];
  useful_parts_other?: string;
  resonated_moment?: string;
  confusing_parts?: string;
  next_steps_clear: TesterClarity;
  missing_to_return?: string;
  paid_value_parts: TesterPaidValuePart[];
  paid_value_parts_other?: string;
  contact?: string;
}
