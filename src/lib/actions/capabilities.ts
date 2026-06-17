"use server";

import { createClient } from "@/lib/supabase/server";
import { safeLogError } from "@/lib/logging/safe-log";
import { revalidatePath } from "next/cache";
import {
  CUSTOM_SECONDARY_GOAL,
  ESCAPE_CONSTRAINTS,
  ESCAPE_GOALS,
  ESCAPE_SKILLS,
  getEffectiveSkills,
  MAX_SECONDARY_GOALS,
  normalizeSecondaryGoals,
  type CapabilitiesFormInput,
  type EscapePlanResult,
  type UserCapabilities,
} from "@/types/escape-plan";
import type { RescuePlan } from "@/types/rescue-plan";

export type SaveCapabilitiesResult =
  | { ok: true; data: UserCapabilities }
  | { ok: false; error: string };

const CAPABILITIES_PATHS = ["/escape-plan", "/dashboard"];

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function revalidateCapabilitiesPages() {
  for (const path of CAPABILITIES_PATHS) {
    revalidatePath(path);
  }
}

function derivePreferredFormat(constraints: string[]): string | null {
  if (constraints.includes("Нужен удалённый формат")) return "remote";
  if (constraints.includes("Только вечером")) return "evenings";
  if (constraints.includes("Только выходные")) return "weekends";
  return null;
}

function formatCapabilitiesDbError(error: { message?: string; code?: string }): string {
  if (error.code === "42703" || error.code === "PGRST204") {
    return "База данных устарела — примените миграции 033–037 в Supabase.";
  }
  if (error.message?.includes("does not exist")) {
    return "База данных устарела — примените миграции 033–037 в Supabase.";
  }
  return error.message ?? "Не удалось сохранить анкету";
}

function isMissingCustomColumnsError(error: { message?: string; code?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("custom_skills") ||
    message.includes("custom_goal") ||
    message.includes("custom_restriction") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function mergeSecondaryGoalsWithCustom(
  primaryGoal: string,
  secondaryGoals: string[],
  customGoal?: string
): string[] {
  const merged = normalizeSecondaryGoals(primaryGoal, secondaryGoals);
  const custom = customGoal?.trim();
  if (!custom || merged.includes(custom)) return merged;
  return [...merged, custom].slice(0, MAX_SECONDARY_GOALS);
}

function normalizeCapabilitiesRow(row: UserCapabilities): UserCapabilities {
  const knownSkills = new Set<string>(ESCAPE_SKILLS);
  const knownConstraints = new Set<string>(ESCAPE_CONSTRAINTS);
  const knownGoals = new Set<string>(ESCAPE_GOALS);

  const skills = row.skills ?? [];
  const constraints = row.constraints ?? [];
  const secondaryGoals = row.secondary_goals ?? [];

  const custom_skills =
    row.custom_skills ??
    skills.filter((skill) => skill !== "Другое" && !knownSkills.has(skill));

  const custom_restriction =
    row.custom_restriction ??
    constraints.find((item) => item !== "Другое" && !knownConstraints.has(item)) ??
    null;

  const custom_goal =
    row.custom_goal ??
    secondaryGoals.find(
      (goal) => goal !== CUSTOM_SECONDARY_GOAL && !knownGoals.has(goal)
    ) ??
    null;

  return {
    ...row,
    skills: skills.filter((skill) => knownSkills.has(skill) || skill === "Другое"),
    constraints: constraints.filter(
      (item) => knownConstraints.has(item) || item === "Другое"
    ),
    custom_skills,
    custom_goal,
    custom_restriction,
    last_rescue_plan: row.last_rescue_plan ?? null,
  };
}

function buildCapabilitiesPayloads(
  userId: string,
  input: CapabilitiesFormInput,
  secondaryGoals: string[],
  customSkills: string[]
) {
  const base = {
    user_id: userId,
    current_work: input.current_work.trim() || null,
    available_hours_per_week: input.available_hours_per_week,
    preferred_format: derivePreferredFormat(input.constraints),
    primary_goal: input.primary_goal,
    updated_at: new Date().toISOString(),
  };

  const modern = {
    ...base,
    skills: input.skills,
    custom_skills: customSkills,
    constraints: input.constraints,
    custom_restriction: input.custom_restriction?.trim() || null,
    secondary_goals: secondaryGoals,
    custom_goal: input.custom_goal?.trim() || null,
  };

  const legacySkills = [
    ...input.skills.filter((skill) => skill !== "Другое"),
    ...customSkills,
  ];
  const legacyConstraints = [
    ...input.constraints.filter((constraint) => constraint !== "Другое"),
    ...(input.custom_restriction?.trim() ? [input.custom_restriction.trim()] : []),
  ];

  const legacy = {
    ...base,
    skills: legacySkills,
    constraints: legacyConstraints,
    secondary_goals: mergeSecondaryGoalsWithCustom(
      input.primary_goal,
      input.secondary_goals,
      input.custom_goal
    ),
  };

  const oldest = {
    user_id: userId,
    current_work: input.current_work.trim() || null,
    skills: legacySkills,
    available_hours_per_week: input.available_hours_per_week,
    constraints: legacyConstraints,
    preferred_format: derivePreferredFormat(input.constraints),
    target_result: input.primary_goal,
    updated_at: new Date().toISOString(),
  };

  return { modern, legacy, oldest };
}

async function upsertCapabilitiesRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  payload: Record<string, unknown>
) {
  const { data: existing } = await supabase
    .from("user_capabilities")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("user_capabilities")
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .single();
  }

  return supabase.from("user_capabilities").insert(payload).select("*").single();
}

export async function getUserCapabilities(): Promise<UserCapabilities | null> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("user_capabilities")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeCapabilitiesRow(data as UserCapabilities);
}

export async function saveUserCapabilities(
  input: CapabilitiesFormInput
): Promise<SaveCapabilitiesResult> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let userId: string;

  try {
    ({ supabase, userId } = await getUserId());
  } catch {
    return { ok: false, error: "Войдите в аккаунт" };
  }

  if (!ESCAPE_GOALS.includes(input.primary_goal as (typeof ESCAPE_GOALS)[number])) {
    return { ok: false, error: "Выберите главную цель" };
  }

  const secondary_goals = normalizeSecondaryGoals(
    input.primary_goal,
    input.secondary_goals
  );

  const custom_skills = input.custom_skills ?? [];
  const effectiveSkills = getEffectiveSkills({
    skills: input.skills,
    custom_skills,
  });

  if (effectiveSkills.length === 0) {
    return { ok: false, error: "Укажите хотя бы один навык" };
  }

  if (
    input.secondary_goals.includes(CUSTOM_SECONDARY_GOAL) &&
    !input.custom_goal?.trim()
  ) {
    return { ok: false, error: "Опишите свою дополнительную цель" };
  }

  if (input.constraints.includes("Другое") && !input.custom_restriction?.trim()) {
    return { ok: false, error: "Опишите ограничение" };
  }

  if (input.skills.includes("Другое") && custom_skills.length === 0) {
    return { ok: false, error: "Укажите свои навыки через запятую" };
  }

  const { modern, legacy, oldest } = buildCapabilitiesPayloads(
    userId,
    input,
    secondary_goals,
    custom_skills
  );

  let { data, error } = await upsertCapabilitiesRow(supabase, userId, modern);

  if (error && isMissingCustomColumnsError(error)) {
    ({ data, error } = await upsertCapabilitiesRow(supabase, userId, legacy));
  }

  if (error && (error.message?.includes("primary_goal") || error.code === "42703")) {
    ({ data, error } = await upsertCapabilitiesRow(supabase, userId, oldest));
  }

  if (error) {
    console.error("[saveUserCapabilities]", safeLogError(error));
    return { ok: false, error: formatCapabilitiesDbError(error) };
  }

  revalidateCapabilitiesPages();
  return { ok: true, data: normalizeCapabilitiesRow(data as UserCapabilities) };
}

export async function saveEscapePlanResult(
  plan: EscapePlanResult,
  rescuePlan?: RescuePlan | null
): Promise<void> {
  const { supabase, userId } = await getUserId();
  const payload: Record<string, unknown> = {
    last_plan: plan,
    updated_at: new Date().toISOString(),
  };
  if (rescuePlan) {
    payload.last_rescue_plan = rescuePlan;
  }

  let { error } = await supabase
    .from("user_capabilities")
    .update(payload)
    .eq("user_id", userId);

  if (error && payload.last_rescue_plan && isMissingCustomColumnsError(error)) {
    const withoutRescue = { ...payload };
    delete withoutRescue.last_rescue_plan;
    ({ error } = await supabase
      .from("user_capabilities")
      .update(withoutRescue)
      .eq("user_id", userId));
  }

  if (error) throw error;
  revalidateCapabilitiesPages();
}
