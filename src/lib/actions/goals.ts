"use server";

import { markOnboardingStep } from "@/lib/actions/onboarding";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FinancialGoal, GoalType } from "@/types/goals";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function getGoals(): Promise<FinancialGoal[]> {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinancialGoal[];
}

export async function createGoal(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const type = formData.get("type") as GoalType;
  const debtId = formData.get("debt_id") as string | null;

  let title = formData.get("title") as string;
  let targetAmount = Number(formData.get("target_amount"));
  let currentAmount = Number(formData.get("current_amount") || 0);

  if (type === "debt_payoff" && debtId) {
    const { data: debt } = await supabase
      .from("debts")
      .select("title, remaining_amount, total_amount")
      .eq("id", debtId)
      .single();

    if (debt) {
      title = title || `Закрыть: ${debt.title}`;
      targetAmount = debt.total_amount;
      currentAmount = debt.total_amount - debt.remaining_amount;
    }
  }

  const { error } = await supabase.from("financial_goals").insert({
    user_id: userId,
    type,
    title,
    target_amount: targetAmount,
    current_amount: currentAmount,
    debt_id: debtId || null,
    deadline: (formData.get("deadline") as string) || null,
  });

  if (error) throw error;
  await markOnboardingStep("goal");
  await trackProductEvent(PRODUCT_EVENTS.GOAL_CREATED, { type }, userId);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/actions");
}

export async function updateGoal(id: string, formData: FormData) {
  const { supabase } = await getUserId();

  const { error } = await supabase
    .from("financial_goals")
    .update({
      title: formData.get("title") as string,
      target_amount: Number(formData.get("target_amount")),
      current_amount: Number(formData.get("current_amount")),
      deadline: (formData.get("deadline") as string) || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/actions");
}

export async function deleteGoal(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("financial_goals").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/actions");
}
