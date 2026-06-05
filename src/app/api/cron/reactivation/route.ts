import { runReactivationCampaign } from "@/lib/reactivation/run-campaign";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReactivationCampaign();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Reactivation cron error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cron failed",
      },
      { status: 500 }
    );
  }
}
