"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  EscapeFollowUpAnswer,
  EscapePlanOption,
  UserEscapePlan,
} from "@/types/escape-plan";

const ESCAPE_PATHS = ["/escape-plan", "/dashboard"];

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function revalidateEscapePages() {
  for (const path of ESCAPE_PATHS) {
    revalidatePath(path);
  }
}

export async function getUserEscapePlans(): Promise<UserEscapePlan[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserEscapePlan[];
}

export async function getPendingEscapeFollowUp(): Promise<UserEscapePlan | null> {
  const { supabase, userId } = await getUserId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_escape_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("follow_up_answer", null)
    .lte("follow_up_due_at", now)
    .order("follow_up_due_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as UserEscapePlan | null;
}

export async function chooseEscapeOption(
  option: EscapePlanOption
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  await supabase
    .from("user_escape_plans")
    .update({
      status: "abandoned",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active");

  const followUpDue = new Date();
  followUpDue.setDate(followUpDue.getDate() + 7);

  const { data, error } = await supabase
    .from("user_escape_plans")
    .insert({
      user_id: userId,
      option_title: option.title,
      option_snapshot: option,
      status: "active",
      follow_up_due_at: followUpDue.toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidateEscapePages();
  return data as UserEscapePlan;
}

export async function answerEscapeFollowUp(
  selectionId: string,
  answer: EscapeFollowUpAnswer
): Promise<UserEscapePlan> {
  const { supabase, userId } = await getUserId();

  const status =
    answer === "yes" ? "completed" : answer === "partial" ? "active" : "abandoned";

  const { data, error } = await supabase
    .from("user_escape_plans")
    .update({
      follow_up_answer: answer,
      follow_up_answered_at: new Date().toISOString(),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  revalidateEscapePages();
  return data as UserEscapePlan;
}
