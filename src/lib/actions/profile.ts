"use server";

import { createClient } from "@/lib/supabase/server";

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
