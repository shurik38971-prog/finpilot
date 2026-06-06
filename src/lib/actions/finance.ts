"use server";

import { createClient } from "@/lib/supabase/server";
import { forecastCashFlow } from "@/lib/finance/forecast";
import { calculateDebtPayoff } from "@/lib/finance/debt-strategies";
import { getUserFinancialProfile } from "@/lib/actions/profile";
import { computeDashboardSummary } from "@/lib/finance/index";
import { getProfileIncomeParameters } from "@/lib/actions/profile-income";
import { filterOperationalIncomes } from "@/lib/finance/operational-incomes";
import { DEFAULT_PROFILE_TYPE, PROFILE_TYPE_LABELS } from "@/types/profile";
import {
  markOnboardingStep,
  markOnboardingSteps,
} from "@/lib/actions/onboarding";
import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { revalidatePath } from "next/cache";
import type { Frequency, IncomeType } from "@/types/database";
import { countIncomesByType } from "@/lib/finance/income-model";

const FINANCIAL_PATHS = [
  "/dashboard",
  "/income",
  "/expenses",
  "/debts",
  "/crisis",
  "/scenarios",
  "/simulator",
  "/analyze",
  "/history",
  "/goals",
  "/actions",
] as const;

function revalidateFinancialPages() {
  for (const path of FINANCIAL_PATHS) {
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

// ── Income ──

export async function getIncomes() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_profile_parameter", false)
    .order("date", { ascending: false });
  if (error) throw error;
  return filterOperationalIncomes(data ?? []);
}

function incomePayloadFromForm(formData: FormData) {
  const incomeType = formData.get("income_type") as IncomeType;
  const isExpected = incomeType === "expected";

  return {
    title: formData.get("title") as string,
    amount: Number(formData.get("amount")),
    category: formData.get("category") as string,
    date: formData.get("date") as string,
    income_type: incomeType,
    is_recurring: isExpected,
    frequency: isExpected ? "monthly" : null,
  };
}

export async function createIncome(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("incomes").insert({
    user_id: userId,
    ...incomePayloadFromForm(formData),
  });
  if (error) throw error;
  await markOnboardingStep("income");
  await trackProductEvent(PRODUCT_EVENTS.INCOME_ADDED, {}, userId);
  revalidateFinancialPages();
}

export async function updateIncome(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const { error } = await supabase
    .from("incomes")
    .update(incomePayloadFromForm(formData))
    .eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

export async function deleteIncome(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("incomes").delete().eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

// ── Expenses ──

export async function getExpenses() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createExpense(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const isRecurring = formData.get("is_recurring") === "on";
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    title: formData.get("title") as string,
    amount: Number(formData.get("amount")),
    category: formData.get("category") as string,
    date: formData.get("date") as string,
    is_recurring: isRecurring,
    frequency: isRecurring ? (formData.get("frequency") as Frequency) : null,
    is_essential: formData.get("is_essential") === "on",
  });
  if (error) throw error;
  await markOnboardingStep("expenses");
  await trackProductEvent(PRODUCT_EVENTS.EXPENSE_ADDED, {}, userId);
  revalidateFinancialPages();
}

export async function updateExpense(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const isRecurring = formData.get("is_recurring") === "on";
  const { error } = await supabase
    .from("expenses")
    .update({
      title: formData.get("title") as string,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      date: formData.get("date") as string,
      is_recurring: isRecurring,
      frequency: isRecurring ? (formData.get("frequency") as Frequency) : null,
      is_essential: formData.get("is_essential") === "on",
    })
    .eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

export async function deleteExpense(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

// ── Debts ──

export async function getDebts() {
  const { supabase, userId } = await getUserId();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createDebt(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("debts").insert({
    user_id: userId,
    title: formData.get("title") as string,
    total_amount: Number(formData.get("total_amount")),
    remaining_amount: Number(formData.get("remaining_amount")),
    interest_rate: Number(formData.get("interest_rate")),
    minimum_payment: Number(formData.get("minimum_payment")),
    due_day: formData.get("due_day") ? Number(formData.get("due_day")) : null,
    priority: Number(formData.get("priority") || 0),
  });
  if (error) throw error;
  await markOnboardingStep("debts");
  await trackProductEvent(PRODUCT_EVENTS.DEBT_ADDED, {}, userId);
  revalidateFinancialPages();
}

export async function updateDebt(id: string, formData: FormData) {
  const { supabase } = await getUserId();
  const { error } = await supabase
    .from("debts")
    .update({
      title: formData.get("title") as string,
      total_amount: Number(formData.get("total_amount")),
      remaining_amount: Number(formData.get("remaining_amount")),
      interest_rate: Number(formData.get("interest_rate")),
      minimum_payment: Number(formData.get("minimum_payment")),
      due_day: formData.get("due_day") ? Number(formData.get("due_day")) : null,
      priority: Number(formData.get("priority") || 0),
    })
    .eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

export async function deleteDebt(id: string) {
  const { supabase } = await getUserId();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
  revalidateFinancialPages();
}

// ── Aggregated data ──

export async function getFinancialData() {
  const [incomes, expenses, debts, profileIncome] = await Promise.all([
    getIncomes(),
    getExpenses(),
    getDebts(),
    getProfileIncomeParameters(),
  ]);
  return { incomes, expenses, debts, profileIncome };
}

export async function getDashboardSummary() {
  const [{ incomes, expenses, debts, profileIncome }, profile] =
    await Promise.all([getFinancialData(), getUserFinancialProfile()]);
  return computeDashboardSummary(
    incomes,
    expenses,
    debts,
    profile.profileType ?? DEFAULT_PROFILE_TYPE,
    profileIncome
  );
}

export async function getAnalysisContext() {
  const [{ incomes, expenses, debts, profileIncome }, profile] =
    await Promise.all([getFinancialData(), getUserFinancialProfile()]);
  const profileType = profile.profileType ?? DEFAULT_PROFILE_TYPE;
  const summary = computeDashboardSummary(
    incomes,
    expenses,
    debts,
    profileType,
    profileIncome
  );
  const forecast = forecastCashFlow(
    incomes,
    expenses,
    debts,
    3,
    profileType,
    profileIncome
  );
  const avalanche = calculateDebtPayoff(debts, 0, "avalanche");

  return {
    profileType,
    profileTypeLabel: PROFILE_TYPE_LABELS[profileType],
    actualMonthlyIncome: summary.totalIncome,
    expectedMonthlyIncome: summary.expectedIncome,
    averageActualIncome3Months: summary.averageActualIncome3Months,
    incomeVsExpectedDelta: summary.totalIncome - summary.expectedIncome,
    monthlyIncome: summary.totalIncome,
    monthlyExpenses: summary.totalExpenses,
    debtPayments: summary.debtPayments,
    netCashFlow: summary.netCashFlow,
    totalDebt: summary.totalDebt,
    financialIndex: summary.financialIndex,
    incomeSources: incomes.length,
    expectedIncomes: countIncomesByType(incomes, "expected"),
    actualIncomes: countIncomesByType(incomes, "actual"),
    essentialExpenses: expenses.filter((e) => e.is_essential).length,
    nonEssentialExpenses: expenses.filter((e) => !e.is_essential).length,
    debtCount: debts.length,
    monthsToDebtFree: avalanche.monthsToFreedom,
    forecastInsufficientData: forecast.insufficientData,
    forecastBasisLabel: forecast.basisLabel,
    threeMonthForecast: forecast.data.map((f) => ({
      month: f.month,
      income: f.income,
      expenses: f.expenses,
      debtPayments: f.debtPayments,
      net: f.net,
      cumulative: f.cumulative,
    })),
  };
}

// ── Demo seed ──

export async function seedDemoData(replace = false) {
  const { supabase, userId } = await getUserId();

  const [incomesRes, expensesRes, debtsRes] = await Promise.all([
    supabase.from("incomes").select("id").eq("user_id", userId),
    supabase.from("expenses").select("id").eq("user_id", userId),
    supabase.from("debts").select("id").eq("user_id", userId),
  ]);

  const hasData =
    (incomesRes.data?.length ?? 0) > 0 ||
    (expensesRes.data?.length ?? 0) > 0 ||
    (debtsRes.data?.length ?? 0) > 0;

  if (hasData && !replace) {
    throw new Error("Данные уже есть. Используйте «Перезагрузить демо».");
  }

  if (replace) {
    await Promise.all([
      supabase.from("incomes").delete().eq("user_id", userId),
      supabase.from("expenses").delete().eq("user_id", userId),
      supabase.from("debts").delete().eq("user_id", userId),
    ]);
  }

  const { DEMO_INCOMES, DEMO_EXPENSES, DEMO_DEBTS } = await import(
    "@/lib/demo-data"
  );

  const { error: incomeError } = await supabase.from("incomes").insert(
    DEMO_INCOMES.map((i) => ({ ...i, user_id: userId }))
  );
  if (incomeError) throw incomeError;

  const { error: expenseError } = await supabase.from("expenses").insert(
    DEMO_EXPENSES.map((e) => ({ ...e, user_id: userId }))
  );
  if (expenseError) throw expenseError;

  const { error: debtError } = await supabase.from("debts").insert(
    DEMO_DEBTS.map((d) => ({ ...d, user_id: userId }))
  );
  if (debtError) throw debtError;

  await markOnboardingSteps(["income", "expenses", "debts"]);
  revalidateFinancialPages();
}
