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
  is_profile_parameter?: boolean;
  is_additional?: boolean;
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

export type DebtPaymentType = "annuity" | "manual";

/** @deprecated Kept for legacy rows; new debts always use calculated + optional actual payment. */
export const DEBT_PAYMENT_TYPE_LABELS: Record<DebtPaymentType, string> = {
  annuity: "Аннуитетный (по сроку и ставке)",
  manual: "Вручную",
};

export type DebtKind =
  | "credit"
  | "credit_card"
  | "microloan"
  | "installment"
  | "personal_loan"
  | "other";

export const DEBT_KIND_LABELS: Record<DebtKind, string> = {
  credit: "Кредит",
  credit_card: "Кредитная карта",
  microloan: "Микрозайм",
  installment: "Рассрочка",
  personal_loan: "Занял у знакомых",
  other: "Другой долг",
};

export const DEBT_KIND_TITLE_PLACEHOLDERS: Record<DebtKind, string> = {
  credit: "Кредит в банке",
  credit_card: "Кредитная карта",
  microloan: "Микрозайм",
  installment: "Рассрочка",
  personal_loan: "Долг знакомому",
  other: "Другой долг",
};

export interface Debt {
  id: string;
  user_id: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  minimum_payment: number;
  term_months: number | null;
  payment_type: DebtPaymentType;
  debt_kind: DebtKind;
  calculated_monthly_payment: number | null;
  actual_monthly_payment: number | null;
  due_day: number | null;
  /** Internal sort score; higher = more urgent. Computed automatically. */
  priority: number;
  is_overdue: boolean;
  notes: string | null;
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
  incomeMin?: number;
  incomeMax?: number;
  expenses: number;
  debtPayments: number;
  net: number;
  netMin?: number;
  netMax?: number;
  cumulative: number;
}

export interface DebtPayoffStep {
  month: number;
  debtTitle: string;
  payment: number;
  remaining: number;
  interestPaid: number;
}

export interface DebtInputSnapshot {
  id: string;
  title: string;
  initialBalance: number;
  annualRatePercent: number;
  monthlyRatePercent: number;
  minimumPayment: number;
  firstMonthInterest: number;
  termMonths: number | null;
  paymentType: DebtPaymentType;
  overpayment: number | null;
}

export interface DebtPayoffLedgerEntry {
  month: number;
  debtTitle: string;
  paymentType: "minimum" | "extra" | "monthly";
  balanceBefore: number;
  interestAccrued: number;
  paymentTotal: number;
  paymentToInterest: number;
  paymentToPrincipal: number;
  balanceAfter: number;
}

export type DebtPayoffStatus = "complete" | "unpayable" | "max_months_reached";

export interface DebtPayoffPlan {
  strategy: "avalanche" | "snowball";
  monthsToFreedom: number;
  totalInterest: number;
  totalPaid: number;
  steps: DebtPayoffStep[];
  ledger: DebtPayoffLedgerEntry[];
  inputSnapshot: DebtInputSnapshot[];
  extraPayment: number;
  warnings: string[];
  status: DebtPayoffStatus;
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

export const EXPENSE_CATEGORY_LABELS: Record<
  (typeof EXPENSE_CATEGORIES)[number],
  string
> = {
  housing: "Жильё / аренда",
  food: "Продукты",
  transport: "Транспорт",
  utilities: "Коммунальные",
  health: "Здоровье",
  subscriptions: "Подписки",
  business: "Бизнес",
  other: "Другое",
};

const EXPENSE_CATEGORY_ALIASES: Record<string, string> = {
  subscription: "Подписки",
  debt: "Долги",
  education: "Обучение",
};

export function getExpenseCategoryLabel(category: string): string {
  if (
    (EXPENSE_CATEGORIES as readonly string[]).includes(category) &&
    category in EXPENSE_CATEGORY_LABELS
  ) {
    return EXPENSE_CATEGORY_LABELS[category as (typeof EXPENSE_CATEGORIES)[number]];
  }
  return EXPENSE_CATEGORY_ALIASES[category] ?? category;
}
