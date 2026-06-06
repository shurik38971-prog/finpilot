export const PROFILE_TYPES = {
  employee: "employee",
  freelancer: "freelancer",
  business_owner: "business_owner",
  retiree: "retiree",
} as const;

export type ProfileType = (typeof PROFILE_TYPES)[keyof typeof PROFILE_TYPES];

export const DEFAULT_PROFILE_TYPE: ProfileType = PROFILE_TYPES.freelancer;

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  employee: "Наёмный сотрудник",
  freelancer: "Самозанятый / Фрилансер",
  business_owner: "Предприниматель",
  retiree: "Пенсионер",
};

export const PROFILE_DASHBOARD_HINTS: Record<ProfileType, string[]> = {
  employee: ["контроль расходов", "накопления", "кредиты"],
  freelancer: [
    "нестабильный доход",
    "резерв на плохие месяцы",
    "подушка безопасности",
  ],
  business_owner: [
    "кассовые разрывы",
    "резерв ликвидности",
    "личные и бизнес-финансы",
  ],
  retiree: [
    "обязательные расходы",
    "финансовая устойчивость",
    "резерв на непредвиденные траты",
  ],
};

export const PROFILE_ONBOARDING_OPTIONS = (
  Object.keys(PROFILE_TYPES) as ProfileType[]
).map((type) => ({
  value: type,
  label: PROFILE_TYPE_LABELS[type],
}));

export function isProfileType(value: string): value is ProfileType {
  return Object.values(PROFILE_TYPES).includes(value as ProfileType);
}

export function resolveProfileType(
  value: string | null | undefined
): ProfileType {
  if (value && isProfileType(value)) return value;
  return DEFAULT_PROFILE_TYPE;
}
