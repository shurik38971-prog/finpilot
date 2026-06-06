export type Frequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type IncomeType = "expected" | "actual";

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  expected: "Ожидаемый доход",
  actual: "Фактическое поступление",
};

export interface Income {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  income_type?: IncomeType | null;
  is_recurring: boolean;
  frequency: Frequency | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  is_recurring: boolean;
  frequency: Frequency | null;
  is_essential: boolean;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_day: number | null;
  priority: number;
  created_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  totalDebt: number;
  monthlyDebtPayments: number;
  financialIndex: number | null;
  savingsRate: number;
}

export interface CashFlowForecast {
  month: string;
  income: number;
  expenses: number;
  debtPayments: number;
  net: number;
  cumulative: number;
}

export interface DebtPayoffStep {
  month: number;
  debtTitle: string;
  payment: number;
  remaining: number;
  interestPaid: number;
}

export interface DebtPayoffPlan {
  strategy: "avalanche" | "snowball";
  monthsToFreedom: number;
  totalInterest: number;
  steps: DebtPayoffStep[];
}

export interface ScenarioResult {
  name: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  extraDebtPayment: number;
  monthsToDebtFree: number;
  financialIndex: number | null;
  threeMonthBalance: number;
}

export const INCOME_CATEGORIES = [
  "freelance",
  "project",
  "royalty",
  "other",
] as const;

export const EXPENSE_CATEGORIES = [
  "housing",
  "food",
  "transport",
  "utilities",
  "health",
  "subscriptions",
  "business",
  "other",
] as const;
