import { trackServerEvent } from "@/lib/analytics/track-server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { safeLogError } from "@/lib/logging/safe-log";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FEEDBACK_TYPES = new Set(["question", "confusion", "idea"]);

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
    const feedbackType = String(body.feedback_type ?? "question");
    const message = String(body.message ?? "").trim();
    const pagePath = body.page_path ? String(body.page_path) : null;
    const sessionId = body.session_id ? String(body.session_id) : null;

    if (!FEEDBACK_TYPES.has(feedbackType)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (message.length < 3 || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const { error } = await supabase.from("user_feedback").insert({
      user_id: user.id,
      feedback_type: feedbackType,
      message,
      page_path: pagePath,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await trackServerEvent({
      event_name: ANALYTICS_EVENTS.FEEDBACK_SENT,
      session_id: sessionId ?? `feedback-${user.id}`,
      page_path: pagePath ?? undefined,
      properties: { feedback_type: feedbackType },
      user_id: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("feedback route:", safeLogError(error));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
