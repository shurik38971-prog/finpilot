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

export const ESCAPE_GOALS = [
  "Закрыть долги",
  "Создать подушку безопасности",
  "Увеличить доход",
  "Снизить расходы",
  "Накопить на крупную покупку",
  "Улучшить финансовую стабильность",
  "Снизить финансовый стресс",
] as const;

export const MAX_SECONDARY_GOALS = 3;

export const DEFAULT_PRIMARY_GOAL = ESCAPE_GOALS[0];

export type EscapeSkill = (typeof ESCAPE_SKILLS)[number];
export type EscapeConstraint = (typeof ESCAPE_CONSTRAINTS)[number];
export type EscapeGoal = (typeof ESCAPE_GOALS)[number];

/** @deprecated use primary_goal */
export const ESCAPE_TARGET_RESULTS = ESCAPE_GOALS;

export interface UserCapabilities {
  id: string;
  user_id: string;
  current_work: string | null;
  skills: string[];
  available_hours_per_week: number | null;
  constraints: string[];
  preferred_format: string | null;
  /** @deprecated use primary_goal */
  target_result: string | null;
  primary_goal: string | null;
  secondary_goals: string[];
  last_plan: EscapePlanResult | null;
  created_at: string;
  updated_at: string;
}

export type EscapePlanOptionType =
  | "increase_income"
  | "reduce_expenses"
  | "debt_action";

export type EscapePlanDifficulty = "low" | "medium" | "high";
export type EscapePlanConfidence = "high" | "medium" | "low";
export type EscapePlanStatus = "planned" | "active" | "completed" | "abandoned";
export type EscapeFollowUpAnswer = "yes" | "partial" | "no";

export const ESCAPE_CONFIDENCE_LABELS: Record<EscapePlanConfidence, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

export interface EscapePlanOption {
  title: string;
  type: EscapePlanOptionType;
  why_fits: string;
  why_chosen: string[];
  first_step: string;
  income_min: number;
  income_max: number;
  /** @deprecated use income_min / income_max */
  expected_effect?: number;
  confidence: EscapePlanConfidence;
  difficulty: EscapePlanDifficulty;
  time_required: string;
  risk: string;
  priority_rank?: number;
  rank_score?: number;
  rank_reasons?: string[];
}

export type EscapeNotRecommendedReasonType = "not_worth" | "not_suitable";

export interface EscapePlanNotRecommended {
  title: string;
  reason: string;
  why_not?: string;
  reason_type?: EscapeNotRecommendedReasonType;
}

export function escapeNotRecommendedLabel(
  item: EscapePlanNotRecommended
): string {
  if (item.reason_type === "not_suitable") return "Почему не подходит";
  return "Почему не стоит";
}

export interface UserEscapePlan {
  id: string;
  user_id: string;
  option_title: string;
  option_snapshot: EscapePlanOption;
  status: EscapePlanStatus;
  follow_up_due_at: string | null;
  follow_up_answer: EscapeFollowUpAnswer | null;
  follow_up_answered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscapePlanResult {
  situation_summary: string;
  needed_amount: number;
  main_strategy: string;
  goals_focus?: string;
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
  primary_goal: string;
  secondary_goals: string[];
}

const LEGACY_TARGET_TO_GOAL: Record<string, EscapeGoal> = {
  "Покрыть дефицит": "Улучшить финансовую стабильность",
  "Закрыть долги": "Закрыть долги",
  "Накопить подушку": "Создать подушку безопасности",
  "Увеличить доход": "Увеличить доход",
  "Снизить расходы": "Снизить расходы",
};

const GOAL_FOCUS_PHRASES: Record<string, string> = {
  "Закрыть долги": "снижение долговой нагрузки",
  "Создать подушку безопасности": "формирование финансовой подушки",
  "Увеличить доход": "рост дохода",
  "Снизить расходы": "сокращение расходов",
  "Накопить на крупную покупку": "накопление на крупную покупку",
  "Улучшить финансовую стабильность": "укрепление финансовой стабильности",
  "Снизить финансовый стресс": "снижение финансового стресса",
};

export function resolvePrimaryGoal(capabilities: UserCapabilities | null): string {
  if (!capabilities) return DEFAULT_PRIMARY_GOAL;
  if (capabilities.primary_goal) return capabilities.primary_goal;
  if (capabilities.target_result) {
    return LEGACY_TARGET_TO_GOAL[capabilities.target_result] ?? DEFAULT_PRIMARY_GOAL;
  }
  return DEFAULT_PRIMARY_GOAL;
}

export function resolveSecondaryGoals(capabilities: UserCapabilities | null): string[] {
  if (!capabilities?.secondary_goals?.length) return [];
  const primary = resolvePrimaryGoal(capabilities);
  return capabilities.secondary_goals
    .filter((goal) => goal !== primary)
    .slice(0, MAX_SECONDARY_GOALS);
}

export function buildGoalsFocusText(
  primaryGoal: string,
  aiFocus?: string
): string {
  if (aiFocus?.trim()) return aiFocus.trim();
  const phrase = GOAL_FOCUS_PHRASES[primaryGoal];
  if (!phrase) {
    return "Поэтому рекомендации согласованы с вашими целями.";
  }
  return `Поэтому рекомендации в первую очередь направлены на ${phrase}.`;
}

export function formatEscapeIncomeRange(option: EscapePlanOption): string | null {
  const min = option.income_min;
  const max = option.income_max;
  if (min > 0 && max > 0) {
    return `${min.toLocaleString("ru-RU")}–${max.toLocaleString("ru-RU")} ₽ / мес`;
  }
  if (option.expected_effect && option.expected_effect > 0) {
    const legacyMin = Math.round(option.expected_effect * 0.5);
    const legacyMax = Math.round(option.expected_effect * 1.5);
    return `${legacyMin.toLocaleString("ru-RU")}–${legacyMax.toLocaleString("ru-RU")} ₽ / мес`;
  }
  return null;
}

export function normalizeSecondaryGoals(
  primaryGoal: string,
  secondaryGoals: string[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const goal of secondaryGoals) {
    if (goal === primaryGoal || seen.has(goal)) continue;
    seen.add(goal);
    result.push(goal);
    if (result.length >= MAX_SECONDARY_GOALS) break;
  }
  return result;
}
