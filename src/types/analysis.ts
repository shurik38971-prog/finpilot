export type AnalysisLevel = "high" | "medium" | "low";
export type HealthStatus = "good" | "bad" | "critical";

export interface AnalysisPlanItem {
  action: string;
  why: string;
}

export interface AiAction30Day {
  priority: AnalysisLevel;
  action: string;
  effect: string;
}

export interface NextBestAction {
  title: string;
  description: string;
  impact_score: number;
  impact_label: string;
  due_days: number;
}

export interface CashGapRisk {
  level: AnalysisLevel;
  description: string;
  months_until_gap?: number | null;
}

export interface AiAnalysisResult {
  summary: string;
  health_status: HealthStatus;
  health_explanation: string;
  main_problem_label: string;
  main_threat: string;
  main_problem?: string;
  money_leaks: string[];
  cash_gap_risk: CashGapRisk;
  plan_7_days: AnalysisPlanItem[];
  plan_30_days: AnalysisPlanItem[];
  plan_90_days: AnalysisPlanItem[];
  actions_30_days?: AiAction30Day[];
  next_best_action?: NextBestAction;
  debt_recommendation?: string;
  cashflow_forecast_comment?: string;
  risks?: { level: AnalysisLevel; title: string; description: string }[];
}

export interface AnalysisApiResponse extends AiAnalysisResult {
  created_tasks_count?: number;
  skipped_duplicate_tasks_count?: number;
  /** @deprecated use created_tasks_count */
  tasks_created?: number;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  financial_index: number | null;
  main_problem: string;
  main_problem_short: string | null;
  next_step: string | null;
  analysis_date: string | null;
  recommendations: AiAnalysisResult;
  model_used: string | null;
  index_delta: number | null;
  comparison_comment: string | null;
  created_at: string;
}

export interface AnalysisComparison {
  current: AnalysisRecord;
  previous: AnalysisRecord;
  indexDelta: number | null;
  comment: string | null;
}
