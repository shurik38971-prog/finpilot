"use server";

import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import {
  shouldShowValueFeedback,
  VALUE_FEEDBACK_SURVEY_VERSION,
} from "@/lib/feedback/value-feedback-eligibility";
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

async function getLatestAnalysisId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("analyses")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
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

export async function getValueFeedbackEligibility(): Promise<{
  shouldShow: boolean;
}> {
  try {
    const { supabase, userId } = await getUserId();
    const shouldShow = await shouldShowValueFeedback(supabase, userId);
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

  const analysisId = await getLatestAnalysisId(supabase, userId);
  const now = new Date().toISOString();

  await patchFeedbackRow(supabase, userId, {
    value_feedback_answer: input.answer,
    value_feedback_detail: detail || null,
    value_feedback_at: now,
    value_feedback_dismissed_at: null,
    value_feedback_analysis_id: analysisId,
    value_feedback_survey_version: VALUE_FEEDBACK_SURVEY_VERSION,
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
    value_feedback_dismissed_at: new Date().toISOString(),
  });
}
