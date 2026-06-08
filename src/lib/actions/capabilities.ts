"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  CUSTOM_SECONDARY_GOAL,
  ESCAPE_GOALS,
  getEffectiveSkills,
  normalizeSecondaryGoals,
  type CapabilitiesFormInput,
  type EscapePlanResult,
  type UserCapabilities,
} from "@/types/escape-plan";

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

export async function getUserCapabilities(): Promise<UserCapabilities | null> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("user_capabilities")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...(data as UserCapabilities),
    custom_skills: (data as UserCapabilities).custom_skills ?? [],
    custom_goal: (data as UserCapabilities).custom_goal ?? null,
    custom_restriction: (data as UserCapabilities).custom_restriction ?? null,
  };
}

export async function saveUserCapabilities(
  input: CapabilitiesFormInput
): Promise<UserCapabilities> {
  const { supabase, userId } = await getUserId();

  if (!ESCAPE_GOALS.includes(input.primary_goal as (typeof ESCAPE_GOALS)[number])) {
    throw new Error("Выберите главную цель");
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
    throw new Error("Укажите хотя бы один навык");
  }

  if (
    input.secondary_goals.includes(CUSTOM_SECONDARY_GOAL) &&
    !input.custom_goal?.trim()
  ) {
    throw new Error("Опишите свою дополнительную цель");
  }

  if (input.constraints.includes("Другое") && !input.custom_restriction?.trim()) {
    throw new Error("Опишите ограничение");
  }

  if (input.skills.includes("Другое") && custom_skills.length === 0) {
    throw new Error("Укажите свои навыки через запятую");
  }

  const payload = {
    user_id: userId,
    current_work: input.current_work.trim() || null,
    skills: input.skills,
    custom_skills,
    available_hours_per_week: input.available_hours_per_week,
    constraints: input.constraints,
    custom_restriction: input.custom_restriction?.trim() || null,
    preferred_format: derivePreferredFormat(input.constraints),
    primary_goal: input.primary_goal,
    secondary_goals,
    custom_goal: input.custom_goal?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("user_capabilities")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let data;
  let error;

  if (existing) {
    ({ data, error } = await supabase
      .from("user_capabilities")
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .single());
  } else {
    ({ data, error } = await supabase
      .from("user_capabilities")
      .insert(payload)
      .select("*")
      .single());
  }

  if (error) throw error;
  revalidateCapabilitiesPages();
  return data as UserCapabilities;
}

export async function saveEscapePlanResult(plan: EscapePlanResult): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("user_capabilities")
    .update({
      last_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
  revalidateCapabilitiesPages();
}
