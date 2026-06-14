import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalysisMode = "preliminary" | "full";
export type AnalysisConfidence = "low" | "medium" | "high";
export type AnalysisDataSource =
  | "registration"
  | "registration_and_operations"
  | "full_history";

export const FULL_ANALYSIS_MIN_DAYS = 30;
export const FULL_ANALYSIS_MIN_OPERATIONS = 20;
export const MEDIUM_CONFIDENCE_MIN_DAYS = 14;
export const MIN_HISTORY_MONTHS = 2;

export interface AnalysisDataMaturity {
  mode: AnalysisMode;
  confidence: AnalysisConfidence;
  dataSource: AnalysisDataSource;
  usageDays: number;
  operationCount: number;
  postOnboardingOperationCount: number;
  historyMonths: number;
  hasSufficientHistory: boolean;
  hasOnboardingBaseline: boolean;
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

function countPostOnboardingOperations(
  rows: Array<{ created_at?: string | null }>,
  baselineCompletedAt: string | null
): number {
  if (!baselineCompletedAt) return 0;
  const cutoff = new Date(baselineCompletedAt).getTime();

  return rows.filter((row) => {
    if (!row.created_at) return false;
    return new Date(row.created_at).getTime() > cutoff;
  }).length;
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

export function resolveAnalysisDataSource(input: {
  usageDays: number;
  hasSufficientHistory: boolean;
  postOnboardingOperationCount: number;
}): AnalysisDataSource {
  if (input.usageDays >= FULL_ANALYSIS_MIN_DAYS && input.hasSufficientHistory) {
    return "full_history";
  }
  if (input.postOnboardingOperationCount > 0) {
    return "registration_and_operations";
  }
  return "registration";
}

export function buildAnalysisDataMaturity(input: {
  userCreatedAt: string;
  incomes: Array<{ date?: string | null; created_at?: string | null }>;
  expenses: Array<{ date?: string | null; created_at?: string | null }>;
  onboardingBaselineAt?: string | null;
  hasOnboardingBaseline?: boolean;
}): AnalysisDataMaturity {
  const usageDays = Math.floor(daysSince(input.userCreatedAt));
  const operationCount = input.incomes.length + input.expenses.length;
  const postOnboardingOperationCount = countPostOnboardingOperations(
    [...input.incomes, ...input.expenses],
    input.onboardingBaselineAt ?? null
  );
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
  const dataSource = resolveAnalysisDataSource({
    usageDays,
    hasSufficientHistory,
    postOnboardingOperationCount,
  });

  return {
    mode,
    confidence,
    dataSource,
    usageDays,
    operationCount,
    postOnboardingOperationCount,
    historyMonths,
    hasSufficientHistory,
    hasOnboardingBaseline: input.hasOnboardingBaseline ?? false,
    isPreliminary: mode === "preliminary",
  };
}

export async function fetchAnalysisDataMaturity(
  supabase: SupabaseClient,
  userId: string,
  userCreatedAt: string
): Promise<AnalysisDataMaturity> {
  const [{ data: incomes }, { data: expenses }, { data: onboarding }] =
    await Promise.all([
      supabase.from("incomes").select("date, created_at").eq("user_id", userId),
      supabase
        .from("expenses")
        .select("date, created_at")
        .eq("user_id", userId),
      supabase
        .from("onboarding_progress")
        .select("income_done, expenses_done, completed, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const hasOnboardingBaseline = Boolean(
    onboarding?.income_done && onboarding?.expenses_done
  );
  const onboardingBaselineAt =
    onboarding?.completed && onboarding.updated_at
      ? onboarding.updated_at
      : null;

  return buildAnalysisDataMaturity({
    userCreatedAt,
    incomes: incomes ?? [],
    expenses: expenses ?? [],
    onboardingBaselineAt,
    hasOnboardingBaseline,
  });
}

export const CONFIDENCE_LABELS: Record<AnalysisConfidence, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
};

export const DATA_SOURCE_LABELS: Record<AnalysisDataSource, string> = {
  registration: "Ответы из анкеты",
  registration_and_operations: "Анкета + доходы и расходы",
  full_history: "Полная история за 30 дней",
};
