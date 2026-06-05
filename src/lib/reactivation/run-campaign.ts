import { REACTIVATION_CAMPAIGN_TYPE } from "@/lib/feedback/constants";
import { sendReactivationEmail } from "@/lib/email/send-reactivation";
import { createServiceClient } from "@/lib/supabase/admin";

const INACTIVE_DAYS = 7;

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function runReactivationCampaign() {
  const supabase = createServiceClient();
  const inactiveSince = daysAgoIso(INACTIVE_DAYS);

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("user_id, created_at");

  if (analysesError) throw analysesError;

  const usersWithAnalysis = new Set((analyses ?? []).map((a) => a.user_id));
  if (usersWithAnalysis.size === 0) {
    return { sent: 0, skipped: 0, errors: 0 };
  }

  const { data: events, error: eventsError } = await supabase
    .from("product_events")
    .select("user_id, created_at")
    .in("user_id", [...usersWithAnalysis])
    .gte("created_at", inactiveSince);

  if (eventsError) throw eventsError;

  const recentlyActive = new Set(
    (events ?? []).map((e) => e.user_id).filter(Boolean)
  );

  const { data: existingCampaigns, error: campaignsError } = await supabase
    .from("email_campaigns")
    .select("user_id")
    .eq("campaign_type", REACTIVATION_CAMPAIGN_TYPE);

  if (campaignsError) throw campaignsError;

  const alreadySent = new Set((existingCampaigns ?? []).map((c) => c.user_id));

  const candidateIds = [...usersWithAnalysis].filter(
    (id) => !recentlyActive.has(id) && !alreadySent.has(id)
  );

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const userId of candidateIds) {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser?.user?.email) {
      skipped++;
      continue;
    }

    const registeredAt = authUser.user.created_at;
    if (registeredAt > inactiveSince) {
      skipped++;
      continue;
    }

    const { data: campaign, error: insertError } = await supabase
      .from("email_campaigns")
      .insert({
        user_id: userId,
        campaign_type: REACTIVATION_CAMPAIGN_TYPE,
      })
      .select("id")
      .single();

    if (insertError || !campaign) {
      errors++;
      continue;
    }

    const emailResult = await sendReactivationEmail({
      to: authUser.user.email,
      campaignId: campaign.id,
      userName: authUser.user.user_metadata?.full_name ?? null,
    });

    if (!emailResult.ok) {
      await supabase.from("email_campaigns").delete().eq("id", campaign.id);
      errors++;
      continue;
    }

    sent++;
  }

  return { sent, skipped, errors, candidates: candidateIds.length };
}
