export const ESCAPE_SKILLS = [
  "Вождение",
  "Работа руками / ремонт",
  "Продажи",
  "Общение с людьми",
  "Компьютеры",
  "Дизайн",
  "Разработка сайтов",
  "Тексты",
  "Маркетинг",
  "Фото / видео",
  "Репетиторство",
  "Доставка",
  "Уход за животными",
  "Другое",
] as const;

export const ESCAPE_HOURS_OPTIONS = [
  { value: 3, label: "2–3 часа" },
  { value: 5, label: "5 часов" },
  { value: 10, label: "10 часов" },
  { value: 15, label: "15+ часов" },
] as const;

export const ESCAPE_CONSTRAINTS = [
  "Нет автомобиля",
  "Нет компьютера",
  "Не хочу общаться по телефону",
  "Не могу работать физически",
  "Нужен удалённый формат",
  "Только вечером",
  "Только выходные",
  "Другое",
] as const;

export const ESCAPE_TARGET_RESULTS = [
  "Покрыть дефицит",
  "Закрыть долги",
  "Накопить подушку",
  "Увеличить доход",
  "Снизить расходы",
] as const;

export type EscapeSkill = (typeof ESCAPE_SKILLS)[number];
export type EscapeConstraint = (typeof ESCAPE_CONSTRAINTS)[number];
export type EscapeTargetResult = (typeof ESCAPE_TARGET_RESULTS)[number];

export interface UserCapabilities {
  id: string;
  user_id: string;
  current_work: string | null;
  skills: string[];
  available_hours_per_week: number | null;
  constraints: string[];
  preferred_format: string | null;
  target_result: string | null;
  last_plan: EscapePlanResult | null;
  created_at: string;
  updated_at: string;
}

export type EscapePlanOptionType =
  | "increase_income"
  | "reduce_expenses"
  | "debt_action";

export type EscapePlanDifficulty = "low" | "medium" | "high";

export interface EscapePlanOption {
  title: string;
  type: EscapePlanOptionType;
  why_fits: string;
  first_step: string;
  expected_effect: number;
  difficulty: EscapePlanDifficulty;
  time_required: string;
  risk: string;
}

export interface EscapePlanNotRecommended {
  title: string;
  reason: string;
}

export interface EscapePlanResult {
  situation_summary: string;
  needed_amount: number;
  main_strategy: string;
  options: EscapePlanOption[];
  not_recommended: EscapePlanNotRecommended[];
  plan_7_days: string[];
}

export interface CapabilitiesFormInput {
  current_work: string;
  skills: string[];
  available_hours_per_week: number;
  constraints: string[];
  constraints_other?: string;
  target_result: string;
}
