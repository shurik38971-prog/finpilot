import { recordSignupCompletedOnce } from "@/lib/actions/analytics-signup";
import { recordPrivacyAcceptance } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await recordSignupCompletedOnce();
      if (user.user_metadata?.privacy_accepted === true) {
        await recordPrivacyAcceptance();
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
