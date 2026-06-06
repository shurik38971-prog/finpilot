"use server";

import { createClient } from "@/lib/supabase/server";
import {
  deriveBaseIncomeFromProfile,
  mapProfileIncomeRow,
  type ProfileIncomeParameters,
} from "@/types/profile-income";
import { revalidatePath } from "next/cache";

const REVALIDATE_PATHS = [
  "/dashboard",
  "/income",
  "/onboarding",
  "/analyze",
  "/scenarios",
  "/simulator",
  "/settings",
] as const;

function revalidateProfileIncomePaths() {
  for (const path of REVALIDATE_PATHS) {
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

export async function getProfileIncomeParameters(): Promise<ProfileIncomeParameters> {
  try {
    const { supabase, userId } = await getUserId();
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "average_month_income, bad_month_income, good_month_income, income_average_monthly, income_bad_month, income_good_month"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return mapProfileIncomeRow(data);
  } catch {
    return mapProfileIncomeRow(null);
  }
}

export async function saveProfileIncomeParameters(
  params: ProfileIncomeParameters
): Promise<void> {
  const { supabase, userId } = await getUserId();
  const now = new Date().toISOString();

  const derivedBase = deriveBaseIncomeFromProfile(params);

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      average_month_income: derivedBase,
      bad_month_income: params.badMonth,
      good_month_income: params.goodMonth,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
  revalidateProfileIncomePaths();
}

export async function clearProfileIncomeParameters(): Promise<void> {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("user_profiles")
    .update({
      average_month_income: null,
      bad_month_income: null,
      good_month_income: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
}
