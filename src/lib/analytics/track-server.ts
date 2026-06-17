import { createClient } from "@/lib/supabase/server";
import { safeLogError } from "@/lib/logging/safe-log";
import type { AnalyticsEventName } from "@/lib/analytics/events";

interface TrackServerEventInput {
  event_name: AnalyticsEventName | string;
  session_id?: string;
  page_path?: string;
  element_id?: string;
  properties?: Record<string, unknown>;
  user_id?: string;
}

export async function trackServerEvent(input: TrackServerEventInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = input.user_id ?? user?.id;
    if (!userId) return;

    await supabase.from("product_events").insert({
      user_id: userId,
      session_id: input.session_id ?? `server-${userId}`,
      event_name: input.event_name,
      page_path: input.page_path ?? null,
      element_id: input.element_id ?? null,
      properties: input.properties ?? {},
    });
  } catch (error) {
    console.error("trackServerEvent failed:", safeLogError(error));
  }
}
