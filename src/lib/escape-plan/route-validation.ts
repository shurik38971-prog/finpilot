import type { EscapeRouteStep } from "@/lib/escape-plan/route-steps";
import {
  classifyRouteTypeFromText,
  combineRouteText,
  detectEarningFormatFromRouteType,
  detectUserSkillFromText,
  isEarningFormat,
  isUserSkillCategory,
  resolveRouteType,
} from "@/lib/escape-plan/route-types";
import { buildStepsForRouteType } from "@/lib/escape-plan/route-step-templates";
import type { EscapePlanOption } from "@/types/escape-plan";

function stepsText(steps: EscapeRouteStep[]): string {
  return steps
    .map((step) => `${step.title} ${step.description} ${step.why_important}`)
    .join(" ");
}

const FORBIDDEN_WORDS: Partial<
  Record<ReturnType<typeof resolveRouteType>, RegExp>
> = {
  consulting_training: /выезд|район работы|набор инструмент|мастер рядом/i,
  cashback_partner: /клиент|заказ|услуг|портфолио/i,
  on_site_service: /реферальн|партнёрск|партнерск|кэшбэк|кешбэк/i,
  freelance_project: /выезд|сантехник|замен.*смесител|набор инструмент/i,
};

export function validateAndFixRouteOption(
  option: EscapePlanOption
): EscapePlanOption {
  if (option.type !== "increase_income") {
    return option;
  }

  const combined = combineRouteText([
    option.title,
    option.why_fits,
    option.first_step,
    ...(option.action_steps ?? []),
  ]);

  let routeType = resolveRouteType(option);
  const inferred = classifyRouteTypeFromText(combined);

  if (FORBIDDEN_WORDS[routeType]?.test(combined) && inferred) {
    routeType = inferred;
  }

  const canonicalSteps = buildStepsForRouteType(routeType, option.title);
  if (FORBIDDEN_WORDS[routeType]?.test(stepsText(canonicalSteps)) && inferred) {
    routeType = inferred;
  }

  if (!inferred && routeType === "generic") {
    routeType = "generic";
  } else if (
    routeType === "generic" &&
    inferred &&
    inferred !== "generic"
  ) {
    routeType = inferred;
  }

  const userSkill = isUserSkillCategory(option.user_skill)
    ? option.user_skill
    : detectUserSkillFromText(combined) ?? undefined;

  const routeTypeEarningFormat = detectEarningFormatFromRouteType(routeType);
  const earningFormat =
    routeTypeEarningFormat ??
    (isEarningFormat(option.earning_format) ? option.earning_format : undefined);

  return {
    ...option,
    route_type: routeType,
    user_skill: userSkill,
    earning_format: earningFormat,
  };
}
