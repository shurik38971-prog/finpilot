"use server";

import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import { shouldShowValueFeedback } from "@/lib/feedback/value-feedback-eligibility";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ValueFeedbackAnswer = "yes" | "partial" | "no";

const ANSWERS = new Set<ValueFeedbackAnswer>(["yes", "partial", "no"]);

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

export async function getValueFeedbackEligibility(input?: {
  clientEngagementMinutes?: number;
}): Promise<{ shouldShow: boolean }> {
  try {
    const { supabase, userId } = await getUserId();
    const shouldShow = await shouldShowValueFeedback(supabase, userId, {
      clientEngagementMinutes: input?.clientEngagementMinutes,
    });
    return { shouldShow };
  } catch {
    return { shouldShow: false };
  }
}

export async function submitValueFeedback(input: {
  answer: ValueFeedbackAnswer;
  detail: string;
}) {
  const { supabase, userId } = await getUserId();

  if (!ANSWERS.has(input.answer)) {
    throw new Error("Invalid answer");
  }

  const detail = input.detail.trim();
  if (detail.length > 2000) {
    throw new Error("Text too long");
  }

  const eligible = await shouldShowValueFeedback(supabase, userId);
  if (!eligible) {
    throw new Error("Feedback cooldown active");
  }

  await patchFeedbackRow(supabase, userId, {
    value_feedback_answer: input.answer,
    value_feedback_detail: detail || null,
    value_feedback_at: new Date().toISOString(),
  });

  await trackProductEvent(
    PRODUCT_EVENTS.FEEDBACK_SUBMITTED,
    { type: "value_feedback", answer: input.answer },
    userId
  );

  revalidatePath("/admin");
  revalidatePath("/admin/insights");
}

export async function dismissValueFeedback() {
  const { supabase, userId } = await getUserId();

  await patchFeedbackRow(supabase, userId, {
    value_feedback_at: new Date().toISOString(),
  });
}
