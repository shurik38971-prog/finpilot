import { recordSignupCompletedOnce } from "@/lib/actions/analytics-signup";
import { initOnboardingForNewUser } from "@/lib/actions/onboarding";
import { recordPrivacyAcceptance } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await recordSignupCompletedOnce();
      if (user.user_metadata?.privacy_accepted === true) {
        await recordPrivacyAcceptance();
      }
      await initOnboardingForNewUser();
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/dashboard";
  if (user) {
    const { data: onboarding } = await supabase
      .from("onboarding_progress")
      .select("completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (onboarding?.completed === false) {
      destination = "/onboarding";
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
