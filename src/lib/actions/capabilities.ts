"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CapabilitiesFormInput,
  EscapePlanResult,
  UserCapabilities,
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
  return data as UserCapabilities | null;
}

export async function saveUserCapabilities(
  input: CapabilitiesFormInput
): Promise<UserCapabilities> {
  const { supabase, userId } = await getUserId();

  const constraints = [...input.constraints];
  if (input.constraints_other?.trim()) {
    constraints.push(input.constraints_other.trim());
  }

  const payload = {
    user_id: userId,
    current_work: input.current_work.trim() || null,
    skills: input.skills,
    available_hours_per_week: input.available_hours_per_week,
    constraints,
    preferred_format: derivePreferredFormat(constraints),
    target_result: input.target_result,
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
