"use server";

import {
  PRODUCT_EVENT_SET,
  type ProductEventName,
} from "@/lib/analytics/product-events";
import { createClient } from "@/lib/supabase/server";

export async function trackProductEvent(
  eventName: ProductEventName | string,
  metadata: Record<string, unknown> = {},
  userId?: string
) {
  if (!PRODUCT_EVENT_SET.has(eventName)) return;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedUserId = userId ?? user?.id;
    if (!resolvedUserId) return;

    await supabase.from("analytics_events").insert({
      user_id: resolvedUserId,
      event_name: eventName,
      metadata,
    });
  } catch (error) {
    console.error("trackProductEvent failed:", error);
  }
}
