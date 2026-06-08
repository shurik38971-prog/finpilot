import type { EscapePlanRankingContext } from "@/lib/escape-plan/rank-options";
import {
  getEffectiveConstraints,
  getEffectiveSkills,
  resolvePrimaryGoal,
  resolveSecondaryGoals,
  type UserCapabilities,
} from "@/types/escape-plan";

export function buildEscapeRankingContext(
  capabilities: UserCapabilities
): EscapePlanRankingContext {
  return {
    skills: getEffectiveSkills(capabilities),
    constraints: getEffectiveConstraints(capabilities),
    primaryGoal: resolvePrimaryGoal(capabilities),
    secondaryGoals: resolveSecondaryGoals(capabilities),
    customSkills: capabilities.custom_skills ?? [],
    customGoal: capabilities.custom_goal,
  };
}
