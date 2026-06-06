"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchAnalysisDataMaturity,
  type AnalysisDataMaturity,
} from "@/lib/finance/analysis-data-maturity";
import { dedupeAnalysesByDay } from "@/lib/finance/history-groups";
import { revalidatePath } from "next/cache";
import type { AnalysisRecord } from "@/types/analysis";

const ANALYSIS_SELECT =
  "id, user_id, financial_index, main_problem, main_problem_short, next_step, analysis_date, recommendations, model_used, index_delta, comparison_comment, created_at";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function getAnalysisDataMaturity(): Promise<AnalysisDataMaturity | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return fetchAnalysisDataMaturity(supabase, user.id, user.created_at);
  } catch {
    return null;
  }
}

export async function getAnalysesHistory(): Promise<AnalysisRecord[]> {
  const { supabase, userId } = await getUserId();

  const { data, error } = await supabase
    .from("analyses")
    .select(ANALYSIS_SELECT)
    .eq("user_id", userId)
    .order("analysis_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return dedupeAnalysesByDay((data ?? []) as AnalysisRecord[]);
}

export async function deleteAnalysis(id: string) {
  const { supabase, userId } = await getUserId();

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  revalidatePath("/history");
}
