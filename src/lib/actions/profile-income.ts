"use server";

import { createClient } from "@/lib/supabase/server";
import {
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
        "income_average_monthly, income_bad_month, income_good_month"
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

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      income_average_monthly: params.averageMonthly,
      income_bad_month: params.badMonth,
      income_good_month: params.goodMonth,
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
      income_average_monthly: null,
      income_bad_month: null,
      income_good_month: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
}
