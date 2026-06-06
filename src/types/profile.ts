export const PROFILE_TYPES = {
  employee: "employee",
  freelancer: "freelancer",
  business_owner: "business_owner",
  retiree: "retiree",
} as const;

export type ProfileType = (typeof PROFILE_TYPES)[keyof typeof PROFILE_TYPES];

/** @deprecated Legacy value stored before profile merge — mapped to freelancer */
export const LEGACY_SELF_EMPLOYED = "self_employed";

export const DEFAULT_PROFILE_TYPE: ProfileType = PROFILE_TYPES.freelancer;

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  employee: "Работа по найму",
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
  if (value === LEGACY_SELF_EMPLOYED) return PROFILE_TYPES.freelancer;
  if (value && isProfileType(value)) return value;
  return DEFAULT_PROFILE_TYPE;
}

export function usesVariableIncome(profileType: ProfileType): boolean {
  return profileType === PROFILE_TYPES.freelancer;
}
