"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PROFILE_TYPE,
  isProfileType,
  type ProfileType,
} from "@/types/profile";
import { revalidatePath } from "next/cache";

const PROFILE_PATHS = [
  "/dashboard",
  "/settings",
  "/analyze",
  "/actions",
  "/goals",
] as const;

function revalidateProfilePaths() {
  for (const path of PROFILE_PATHS) {
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

export async function getUserFinancialProfile(): Promise<{
  profileType: ProfileType | null;
  needsProfileSetup: boolean;
}> {
  try {
    const { supabase, userId } = await getUserId();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("profile_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    const profileType =
      data?.profile_type && isProfileType(data.profile_type)
        ? data.profile_type
        : null;

    return {
      profileType,
      needsProfileSetup: profileType === null,
    };
  } catch {
    return {
      profileType: DEFAULT_PROFILE_TYPE,
      needsProfileSetup: false,
    };
  }
}

export async function getProfileTypeForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ProfileType> {
  const { data } = await supabase
    .from("user_profiles")
    .select("profile_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.profile_type && isProfileType(data.profile_type)) {
    return data.profile_type;
  }

  return DEFAULT_PROFILE_TYPE;
}

export async function setUserProfileType(
  profileType: ProfileType
): Promise<void> {
  if (!isProfileType(profileType)) {
    throw new Error("Invalid profile type");
  }

  const { supabase, userId } = await getUserId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      profile_type: profileType,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;

  const { data: onboarding } = await supabase
    .from("onboarding_progress")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (onboarding) {
    await supabase
      .from("onboarding_progress")
      .update({ profile_done: true, updated_at: now })
      .eq("user_id", userId);
  } else {
    await supabase.from("onboarding_progress").insert({
      user_id: userId,
      profile_done: true,
    });
  }

  revalidateProfilePaths();
}

export async function recordPrivacyAcceptance(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const now = new Date().toISOString();

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      privacy_accepted: true,
      privacy_accepted_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("recordPrivacyAcceptance:", error);
  }
}
