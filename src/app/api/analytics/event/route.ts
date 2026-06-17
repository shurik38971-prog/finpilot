import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { safeLogError } from "@/lib/logging/safe-log";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_EVENTS = new Set<string>(Object.values(ANALYTICS_EVENTS));

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const events = Array.isArray(body.events) ? body.events : [body];

    const rows = events
      .filter(
        (e: { event_name?: string; session_id?: string }) =>
          e?.event_name && e?.session_id && ALLOWED_EVENTS.has(e.event_name)
      )
      .slice(0, 20)
      .map(
        (e: {
          event_name: string;
          session_id: string;
          page_path?: string;
          element_id?: string;
          properties?: Record<string, unknown>;
        }) => ({
          user_id: user.id,
          session_id: String(e.session_id).slice(0, 64),
          event_name: e.event_name,
          page_path: e.page_path?.slice(0, 256) ?? null,
          element_id: e.element_id?.slice(0, 128) ?? null,
          properties: e.properties ?? {},
        })
      );

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    const { error } = await supabase.from("product_events").insert(rows);
    if (error) {
      console.error("analytics insert error:", safeLogError(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (error) {
    console.error("analytics event route:", safeLogError(error));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
