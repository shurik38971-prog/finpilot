"use server";

import { markOnboardingStep } from "@/lib/actions/onboarding";
import { saveProfileIncomeParameters } from "@/lib/actions/profile-income";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { createClient } from "@/lib/supabase/server";
import type { GoalType } from "@/types/goals";
import { revalidatePath } from "next/cache";

const WIZARD_PATHS = ["/onboarding", "/dashboard", "/analyze"] as const;

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function revalidateWizardPaths() {
  for (const path of WIZARD_PATHS) {
    revalidatePath(path);
  }
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

async function insertIncome(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: {
    title: string;
    amount: number;
    category: string;
    income_type: "expected" | "actual";
    is_recurring: boolean;
    frequency: "monthly" | null;
  }
) {
  const { error } = await supabase.from("incomes").insert({
    user_id: userId,
    date: todayIso(),
    ...payload,
  });
  if (error) throw error;
}

export async function saveWizardEmployeeIncome(
  amount: number,
  frequency: "monthly" | "twice_monthly" | "weekly"
) {
  const { supabase, userId } = await getUserId();
  const monthlyAmount =
    frequency === "weekly"
      ? Math.round(amount * 4.33)
      : frequency === "twice_monthly"
        ? amount * 2
        : amount;

  await insertIncome(userId, supabase, {
    title: "Зарплата",
    amount: monthlyAmount,
    category: "other",
    income_type: "expected",
    is_recurring: true,
    frequency: "monthly",
  });

  await markOnboardingStep("income");
  await trackProductEvent(PRODUCT_EVENTS.INCOME_ADDED, {}, userId);
  revalidateWizardPaths();
}

export async function saveWizardVariableIncome(data: {
  badMonth: number;
  averageMonth: number;
  goodMonth: number;
}) {
  const { userId } = await getUserId();

  await saveProfileIncomeParameters({
    badMonth: data.badMonth,
    averageMonthly: data.averageMonth,
    goodMonth: data.goodMonth,
  });

  await markOnboardingStep("income");
  await trackProductEvent(
    PRODUCT_EVENTS.INCOME_ADDED,
    { source: "profile_parameters" },
    userId
  );
  revalidateWizardPaths();
}

export async function saveWizardBusinessIncome(average: number) {
  const { supabase, userId } = await getUserId();

  await insertIncome(userId, supabase, {
    title: "Средний доход бизнеса",
    amount: average,
    category: "project",
    income_type: "expected",
    is_recurring: true,
    frequency: "monthly",
  });

  await markOnboardingStep("income");
  await trackProductEvent(PRODUCT_EVENTS.INCOME_ADDED, {}, userId);
  revalidateWizardPaths();
}

export async function saveWizardRetireeIncome(amount: number) {
  const { supabase, userId } = await getUserId();

  await insertIncome(userId, supabase, {
    title: "Пенсия",
    amount,
    category: "other",
    income_type: "expected",
    is_recurring: true,
    frequency: "monthly",
  });

  await markOnboardingStep("income");
  await trackProductEvent(PRODUCT_EVENTS.INCOME_ADDED, {}, userId);
  revalidateWizardPaths();
}

export async function saveWizardExpenses(
  items: { title: string; category: string; amount: number }[]
) {
  const { supabase, userId } = await getUserId();
  const valid = items.filter((item) => item.amount > 0);

  if (valid.length === 0) {
    throw new Error("Добавьте хотя бы один расход");
  }

  const { error } = await supabase.from("expenses").insert(
    valid.map((item) => ({
      user_id: userId,
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: todayIso(),
      is_recurring: true,
      frequency: "monthly",
      is_essential: true,
    }))
  );

  if (error) throw error;

  await markOnboardingStep("expenses");
  await trackProductEvent(PRODUCT_EVENTS.EXPENSE_ADDED, {}, userId);
  revalidateWizardPaths();
}

export async function saveWizardDebt(data: {
  title: string;
  remainingAmount: number;
  minimumPayment: number;
}) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase.from("debts").insert({
    user_id: userId,
    title: data.title,
    total_amount: data.remainingAmount,
    remaining_amount: data.remainingAmount,
    interest_rate: 0,
    minimum_payment: data.minimumPayment,
    due_day: null,
    priority: 0,
  });

  if (error) throw error;

  await markOnboardingStep("debts");
  await trackProductEvent(PRODUCT_EVENTS.DEBT_ADDED, {}, userId);
  revalidateWizardPaths();
}

export async function skipWizardDebts() {
  await markOnboardingStep("debts");
  revalidateWizardPaths();
}

export async function saveWizardGoal(data: {
  type: GoalType;
  title: string;
  targetAmount: number;
}) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase.from("financial_goals").insert({
    user_id: userId,
    type: data.type,
    title: data.title,
    target_amount: data.targetAmount,
    current_amount: 0,
    debt_id: null,
    deadline: null,
  });

  if (error) throw error;

  await markOnboardingStep("goal");
  await trackProductEvent(PRODUCT_EVENTS.GOAL_CREATED, { type: data.type }, userId);
  revalidateWizardPaths();
}
