"use server";

import { PRODUCT_EVENTS } from "@/lib/analytics/product-events";
import { trackProductEvent } from "@/lib/analytics/track-product";
import type { LowRatingReasonId } from "@/lib/feedback/low-rating-reasons";
import { LOW_RATING_REASONS } from "@/lib/feedback/low-rating-reasons";
import { createClient } from "@/lib/supabase/server";

const ANALYSIS_RATING_COOLDOWN_DAYS = 7;

const RECOMMENDATION_VALUES = new Set(["strongly", "slightly", "no"]);
const LOW_RATING_REASON_IDS = new Set(
  LOW_RATING_REASONS.map((reason) => reason.id)
);

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function shouldShowAnalysisRating(): Promise<boolean> {
  try {
    const { supabase, userId } = await getUserId();
    const since = new Date();
    since.setDate(since.getDate() - ANALYSIS_RATING_COOLDOWN_DAYS);

    const { data } = await supabase
      .from("analysis_ratings")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString())
      .limit(1)
      .maybeSingle();

    return data == null;
  } catch {
    return false;
  }
}

export async function submitAnalysisRating(input: {
  rating: number;
  analysisId?: string | null;
}) {
  const { supabase, userId } = await getUserId();
  const rating = Math.round(input.rating);

  if (rating < 1 || rating > 5) {
    throw new Error("Invalid rating");
  }

  const eligible = await shouldShowAnalysisRating();
  if (!eligible) {
    throw new Error("Rating cooldown active");
  }

  const { error } = await supabase.from("analysis_ratings").insert({
    user_id: userId,
    analysis_id: input.analysisId ?? null,
    rating,
  });

  if (error) throw error;

  await trackProductEvent(PRODUCT_EVENTS.FEEDBACK_SUBMITTED, {
    type: "analysis_rating",
    rating,
  });
}

export async function submitTaskRecommendationRating(input: {
  taskId: string;
  rating: "strongly" | "slightly" | "no";
  lowRatingReason?: LowRatingReasonId | null;
}) {
  const { supabase, userId } = await getUserId();

  if (!RECOMMENDATION_VALUES.has(input.rating)) {
    throw new Error("Invalid rating");
  }

  if (
    input.lowRatingReason &&
    !LOW_RATING_REASON_IDS.has(input.lowRatingReason)
  ) {
    throw new Error("Invalid reason");
  }

  if (
    input.rating === "no" &&
    !input.lowRatingReason
  ) {
    throw new Error("Reason required");
  }

  const { data: task } = await supabase
    .from("financial_tasks")
    .select("title")
    .eq("id", input.taskId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("task_recommendation_ratings").insert({
    user_id: userId,
    task_id: input.taskId,
    task_title: task?.title ?? null,
    rating: input.rating,
    low_rating_reason: input.lowRatingReason ?? null,
  });

  if (error) throw error;

  await trackProductEvent(PRODUCT_EVENTS.FEEDBACK_SUBMITTED, {
    type: "task_recommendation",
    rating: input.rating,
    task_id: input.taskId,
  });
}

export async function dismissTaskRecommendationRating(taskId: string) {
  await trackProductEvent(PRODUCT_EVENTS.FEEDBACK_SUBMITTED, {
    type: "task_recommendation",
    rating: "dismissed",
    task_id: taskId,
  });
}
