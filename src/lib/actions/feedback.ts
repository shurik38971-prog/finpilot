"use server";

import {
  type UsefulFeatureId,
  USEFUL_FEATURES,
} from "@/lib/feedback/constants";
import { shouldShowQuickFeedback } from "@/lib/feedback/quick-feedback";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const FEATURE_IDS = new Set(USEFUL_FEATURES.map((f) => f.id));
const MESSAGE_TYPES = new Set(["idea", "bug", "confusion"]);

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

async function patchFeedbackRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  fields: Record<string, unknown>
) {
  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("feedback")
      .update(fields)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("feedback")
    .insert({ user_id: userId, ...fields });
  if (error) throw error;
}

export async function getQuickFeedbackEligibility(): Promise<{
  shouldShow: boolean;
}> {
  try {
    const { supabase, userId } = await getUserId();
    const shouldShow = await shouldShowQuickFeedback(supabase, userId);
    return { shouldShow };
  } catch {
    return { shouldShow: false };
  }
}

export async function submitQuickFeedback(input: {
  rating: number;
  usefulText: string;
}) {
  const { supabase, userId } = await getUserId();
  const rating = Math.round(input.rating);

  if (rating < 1 || rating > 5) {
    throw new Error("Invalid rating");
  }

  const usefulText = input.usefulText.trim();
  if (usefulText.length > 2000) {
    throw new Error("Text too long");
  }

  await patchFeedbackRow(supabase, userId, {
    rating_score: rating,
    quick_useful_text: usefulText || null,
    quick_feedback_at: new Date().toISOString(),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/insights");
}

export async function dismissQuickFeedback() {
  const { supabase, userId } = await getUserId();

  await patchFeedbackRow(supabase, userId, {
    quick_feedback_at: new Date().toISOString(),
  });
}

export async function hasProductFeedback(): Promise<boolean> {
  try {
    const { supabase, userId } = await getUserId();
    const { data } = await supabase
      .from("feedback")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return data != null;
  } catch {
    return false;
  }
}

export async function submitProductFeedback(input: {
  most_useful_feature: UsefulFeatureId;
  took_action: boolean;
  action_description: string;
  confusion_text: string;
  missing_feature: string;
  lost_value_text: string;
}) {
  const { supabase, userId } = await getUserId();

  if (!FEATURE_IDS.has(input.most_useful_feature)) {
    throw new Error("Invalid feature");
  }

  if (input.took_action) {
    const desc = input.action_description.trim();
    if (desc.length < 2 || desc.length > 2000) {
      throw new Error("Describe what you did");
    }
  }

  const featureLabel =
    USEFUL_FEATURES.find((f) => f.id === input.most_useful_feature)?.label ??
    input.most_useful_feature;

  const { error } = await supabase.from("feedback").upsert(
    {
      user_id: userId,
      most_useful_feature: featureLabel,
      took_action: input.took_action,
      action_description: input.took_action
        ? input.action_description.trim()
        : null,
      confusion_text: input.confusion_text.trim() || null,
      missing_feature: input.missing_feature.trim() || null,
      lost_value_text: input.lost_value_text.trim() || null,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/insights");
}

export async function submitFeedbackMessage(input: {
  type: "idea" | "bug" | "confusion";
  message: string;
}) {
  const { supabase, userId } = await getUserId();
  const message = input.message.trim();

  if (!MESSAGE_TYPES.has(input.type)) {
    throw new Error("Invalid type");
  }

  if (message.length < 3 || message.length > 2000) {
    throw new Error("Invalid message length");
  }

  const { error } = await supabase.from("feedback_messages").insert({
    user_id: userId,
    type: input.type,
    message,
  });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/insights");
}
