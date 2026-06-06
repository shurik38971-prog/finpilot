import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalysisMode = "preliminary" | "full";
export type AnalysisConfidence = "low" | "medium" | "high";

export const FULL_ANALYSIS_MIN_DAYS = 30;
export const FULL_ANALYSIS_MIN_OPERATIONS = 20;
export const MEDIUM_CONFIDENCE_MIN_DAYS = 14;
export const MIN_HISTORY_MONTHS = 2;

export interface AnalysisDataMaturity {
  mode: AnalysisMode;
  confidence: AnalysisConfidence;
  usageDays: number;
  operationCount: number;
  historyMonths: number;
  hasSufficientHistory: boolean;
  isPreliminary: boolean;
}

function daysSince(iso: string): number {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, (Date.now() - start) / (1000 * 60 * 60 * 24));
}

function countHistoryMonths(
  rows: Array<{ date?: string | null; created_at?: string | null }>
): number {
  const months = new Set<string>();

  for (const row of rows) {
    const source = row.date ?? row.created_at;
    if (!source) continue;
    months.add(source.slice(0, 7));
  }

  return months.size;
}

export function resolveAnalysisConfidence(
  usageDays: number,
  hasSufficientHistory: boolean
): AnalysisConfidence {
  if (usageDays >= FULL_ANALYSIS_MIN_DAYS && hasSufficientHistory) {
    return "high";
  }
  if (usageDays >= MEDIUM_CONFIDENCE_MIN_DAYS) {
    return "medium";
  }
  return "low";
}

export function resolveAnalysisMode(input: {
  usageDays: number;
  operationCount: number;
  hasSufficientHistory: boolean;
}): AnalysisMode {
  const hasFullUsageWindow = input.usageDays >= FULL_ANALYSIS_MIN_DAYS;
  const hasEnoughOperations = input.operationCount >= FULL_ANALYSIS_MIN_OPERATIONS;

  if ((hasFullUsageWindow || hasEnoughOperations) && input.hasSufficientHistory) {
    return "full";
  }

  return "preliminary";
}

export function buildAnalysisDataMaturity(input: {
  userCreatedAt: string;
  incomes: Array<{ date?: string | null; created_at?: string | null }>;
  expenses: Array<{ date?: string | null; created_at?: string | null }>;
}): AnalysisDataMaturity {
  const usageDays = Math.floor(daysSince(input.userCreatedAt));
  const operationCount = input.incomes.length + input.expenses.length;
  const historyMonths = countHistoryMonths([
    ...input.incomes,
    ...input.expenses,
  ]);
  const hasSufficientHistory = historyMonths >= MIN_HISTORY_MONTHS;
  const mode = resolveAnalysisMode({
    usageDays,
    operationCount,
    hasSufficientHistory,
  });
  const confidence = resolveAnalysisConfidence(usageDays, hasSufficientHistory);

  return {
    mode,
    confidence,
    usageDays,
    operationCount,
    historyMonths,
    hasSufficientHistory,
    isPreliminary: mode === "preliminary",
  };
}

export async function fetchAnalysisDataMaturity(
  supabase: SupabaseClient,
  userId: string,
  userCreatedAt: string
): Promise<AnalysisDataMaturity> {
  const [{ data: incomes }, { data: expenses }] = await Promise.all([
    supabase.from("incomes").select("date, created_at").eq("user_id", userId),
    supabase.from("expenses").select("date, created_at").eq("user_id", userId),
  ]);

  return buildAnalysisDataMaturity({
    userCreatedAt,
    incomes: incomes ?? [],
    expenses: expenses ?? [],
  });
}

export const CONFIDENCE_LABELS: Record<AnalysisConfidence, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};
