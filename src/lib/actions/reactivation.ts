"use server";

import { REACTIVATION_CAMPAIGN_TYPE } from "@/lib/feedback/constants";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function respondToReactivationCampaign(input: {
  campaignId: string;
  answer: "yes" | "no";
  note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: campaign, error: fetchError } = await supabase
    .from("email_campaigns")
    .select("id, user_id, campaign_type")
    .eq("id", input.campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!campaign) throw new Error("Campaign not found");

  if (input.answer === "no") {
    const note = input.note?.trim();
    if (!note || note.length < 2) {
      throw new Error("Опишите, что помешало");
    }
  }

  const { error } = await supabase
    .from("email_campaigns")
    .update({
      opened: true,
      completed: true,
      response_answer: input.answer,
      response_note:
        input.answer === "no" ? input.note?.trim() ?? null : null,
    })
    .eq("id", input.campaignId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/admin/insights");
}

export async function markReactivationOpened(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("email_campaigns")
    .update({ opened: true })
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .eq("campaign_type", REACTIVATION_CAMPAIGN_TYPE);
}
