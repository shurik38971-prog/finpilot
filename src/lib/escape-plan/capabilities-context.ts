import type { EscapePlanRankingContext } from "@/lib/escape-plan/rank-options";
import {
  getEffectiveConstraints,
  getEffectiveSkills,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type UserCapabilities,
  type UserEscapePlan,
} from "@/types/escape-plan";
import { ESCAPE_FAILURE_REASONS } from "@/types/rescue-plan";

export function buildEscapeRankingContext(
  capabilities: UserCapabilities,
  failedPlans: UserEscapePlan[] = []
): EscapePlanRankingContext {
  const reasonLabels = Object.fromEntries(
    ESCAPE_FAILURE_REASONS.map((item) => [item.value, item.label])
  );

  return {
    skills: getEffectiveSkills(capabilities),
    constraints: getEffectiveConstraints(capabilities),
    primaryGoal: resolvePrimaryGoal(capabilities),
    secondaryGoals: resolveSecondaryGoals(capabilities),
    customSkills: capabilities.custom_skills ?? [],
    customGoal: capabilities.custom_goal,
    failedAttempts: failedPlans.map((plan) => ({
      optionTitle: plan.option_title,
      reason:
        reasonLabels[plan.failure_reason ?? "other"] ??
        plan.failure_reason ??
        "не сработало",
    })),
  };
}
