"use server";

import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { createClient } from "@/lib/supabase/server";

export async function recordSignupCompleted() {
  await trackProductEvent(PRODUCT_EVENTS.SIGNUP_COMPLETED);
}

/** Для подтверждения email — не дублирует событие регистрации. */
export async function recordSignupCompletedOnce() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("analytics_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_name", PRODUCT_EVENTS.SIGNUP_COMPLETED)
    .limit(1)
    .maybeSingle();

  if (!data) {
    await trackProductEvent(PRODUCT_EVENTS.SIGNUP_COMPLETED, {}, user.id);
  }
}
