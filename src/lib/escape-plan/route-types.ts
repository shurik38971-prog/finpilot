import type { EscapePlanOption } from "@/types/escape-plan";

export const ROUTE_TYPES = [
  "on_site_service",
  "remote_service",
  "consulting_training",
  "freelance_project",
  "cashback_partner",
  "resale_trade",
  "simple_side_job",
  "generic",
] as const;

export type RouteType = (typeof ROUTE_TYPES)[number];

export const EARNING_FORMATS = [
  "on_site_services",
  "remote_services",
  "consulting_training",
  "freelance_project",
  "cashback_partner",
  "resale_trade",
  "simple_side_job",
] as const;

export type EarningFormat = (typeof EARNING_FORMATS)[number];

export const USER_SKILL_CATEGORIES = [
  "plumbing",
  "computers",
  "web_development",
  "repair",
  "sales",
  "other",
] as const;

export type UserSkillCategory = (typeof USER_SKILL_CATEGORIES)[number];

export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  on_site_service: "Выездные услуги",
  remote_service: "Удалённые услуги",
  consulting_training: "Консультации / обучение",
  freelance_project: "Фриланс-проект",
  cashback_partner: "Партнёрки / кэшбэк",
  resale_trade: "Перепродажа / торговля",
  simple_side_job: "Разовые подработки",
  generic: "Общий маршрут",
};

const CONSULTING_PATTERN =
  /обучени|консультаци|консультация|научить|объяснить|помочь разобраться/i;
const TITLE_CONSULTING_PATTERN = /обучени|консультаци|консультация/i;
const CASHBACK_PATTERN =
  /кэшбэк|кешбэк|партнёрск|партнерск|реферальн|affiliate|бонус/i;
const FREELANCE_PROJECT_PATTERN =
  /сайт|лендинг|разработк.*сайт|веб-разработ|дизайн|tilda|wordpress|landing/i;
const ON_SITE_PATTERN =
  /выезд|ремонт|замен|мастер|сантехник|на дому|на заказ/i;
const REMOTE_PATTERN = /удалён|удален|онлайн|дистанцион|удаленно/i;
const RESALE_PATTERN =
  /перепродаж|торговл|маркетплейс|закуп.*продаж|товар.*авито/i;
const SIDE_JOB_PATTERN = /подработк|разов.*заработ|смен|выходн.*работ/i;

const SKILL_PATTERNS: Array<{ skill: UserSkillCategory; pattern: RegExp }> = [
  { skill: "plumbing", pattern: /сантех|смесител|труб|канализ/i },
  { skill: "computers", pattern: /компьютер|пк|ноутбук|it-помощ|it помощ/i },
  {
    skill: "web_development",
    pattern: /разработк.*сайт|сайт|веб|лендинг|tilda|wordpress/i,
  },
  {
    skill: "repair",
    pattern: /ремонт|мастер|работа руками|сборк|монтаж/i,
  },
  { skill: "sales", pattern: /продаж|менеджер по продаж|торгов/i },
];

export function isRouteType(value: unknown): value is RouteType {
  return (
    typeof value === "string" &&
    (ROUTE_TYPES as readonly string[]).includes(value)
  );
}

export function isEarningFormat(value: unknown): value is EarningFormat {
  return (
    typeof value === "string" &&
    (EARNING_FORMATS as readonly string[]).includes(value)
  );
}

export function isUserSkillCategory(value: unknown): value is UserSkillCategory {
  return (
    typeof value === "string" &&
    (USER_SKILL_CATEGORIES as readonly string[]).includes(value)
  );
}

export function combineRouteText(
  parts: Array<string | null | undefined>
): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function classifyRouteTypeFromText(text: string): RouteType | null {
  const normalized = text.trim();
  if (!normalized) return null;

  if (CONSULTING_PATTERN.test(normalized)) return "consulting_training";
  if (CASHBACK_PATTERN.test(normalized)) return "cashback_partner";
  if (FREELANCE_PROJECT_PATTERN.test(normalized)) return "freelance_project";

  if (
    ON_SITE_PATTERN.test(normalized) &&
    !CONSULTING_PATTERN.test(normalized)
  ) {
    return "on_site_service";
  }

  if (REMOTE_PATTERN.test(normalized)) return "remote_service";
  if (RESALE_PATTERN.test(normalized)) return "resale_trade";
  if (SIDE_JOB_PATTERN.test(normalized)) return "simple_side_job";

  return null;
}

export function detectUserSkillFromText(text: string): UserSkillCategory | null {
  for (const { skill, pattern } of SKILL_PATTERNS) {
    if (pattern.test(text)) return skill;
  }
  return null;
}

export function detectEarningFormatFromRouteType(
  routeType: RouteType
): EarningFormat | null {
  switch (routeType) {
    case "on_site_service":
      return "on_site_services";
    case "remote_service":
      return "remote_services";
    case "consulting_training":
      return "consulting_training";
    case "freelance_project":
      return "freelance_project";
    case "cashback_partner":
      return "cashback_partner";
    case "resale_trade":
      return "resale_trade";
    case "simple_side_job":
      return "simple_side_job";
    default:
      return null;
  }
}

function reconcileRouteType(
  declared: RouteType | null,
  inferred: RouteType | null
): RouteType {
  if (!declared && !inferred) return "generic";
  if (!declared) return inferred ?? "generic";
  if (!inferred) return declared;

  const consultingWins =
    inferred === "consulting_training" &&
    (declared === "on_site_service" || declared === "remote_service");
  if (consultingWins) return "consulting_training";

  if (inferred === "cashback_partner" && declared !== "cashback_partner") {
    return "cashback_partner";
  }

  if (inferred === "freelance_project" && declared === "on_site_service") {
    return "freelance_project";
  }

  return declared;
}

export function resolveRouteType(
  option: Pick<EscapePlanOption, "title" | "type"> &
    Partial<Pick<EscapePlanOption, "why_fits" | "first_step" | "route_type">>
): RouteType {
  if (option.type !== "increase_income") {
    return "generic";
  }

  if (TITLE_CONSULTING_PATTERN.test(option.title)) {
    return "consulting_training";
  }

  const combined = combineRouteText([
    option.title,
    option.why_fits,
    option.first_step,
  ]);

  const inferred = classifyRouteTypeFromText(combined);
  const declared = isRouteType(option.route_type) ? option.route_type : null;

  return reconcileRouteType(declared, inferred);
}

/** @deprecated use resolveRouteType */
export function isCashbackPartnerRoute(title: string): boolean {
  return resolveRouteType({ title, type: "increase_income" }) === "cashback_partner";
}
