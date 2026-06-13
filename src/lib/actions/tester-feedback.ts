"use server";

import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function hasTesterFeedbackSubmitted(): Promise<boolean> {
  try {
    const { supabase, userId } = await getUserId();
    const { count, error } = await supabase
      .from("tester_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.error("hasTesterFeedbackSubmitted:", error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
