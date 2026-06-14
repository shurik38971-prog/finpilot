import { computeDashboardSummary } from "@/lib/finance/index";
import {
  hasQuantifiableFinancialEffect,
  isInformationalFinancialTask,
} from "@/lib/finance/task-effect-eligibility";
import { pickPrimaryGoal } from "@/lib/finance/match-task-to-goal";
import type { Debt, Expense, Income } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import { DEFAULT_PROFILE_TYPE, type ProfileType } from "@/types/profile";
import type {
  CurrentFinanceState,
  TaskImpactSimulation,
} from "@/types/task-impact";

export interface TaskForSimulation {
  title: string;
  description: string | null;
  impact_score: number;
  goal_id: string | null;
  goal_progress_amount: number | null;
}

export interface WhatIfInput {
  incomeChangePercent: number;
  expenseChangePercent: number;
  debtPaymentChangePercent: number;
  totalDebtChangePercent: number;
}

export interface WhatIfResult {
  financialIndex: number | null;
  netCashFlow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  debtPayments: number;
  totalDebt: number;
  debtLoadPercent: number;
  goalMonths: number | null;
  goalTitle: string | null;
}

const DEBT_KEYWORDS = [
  "долг",
  "кредит",
  "займ",
  "ипотек",
  "реструктур",
  "рефинанс",
  "процент",
  "погас",
];
const EXPENSE_KEYWORDS = [
  "расход",
  "подписк",
  "сократ",
  "эконом",
  "отказ",
  "лишн",
  "оптимиз",
];
const INCOME_KEYWORDS = [
  "доход",
  "заработ",
  "клиент",
  "заказ",
  "повыс",
  "поднять",
  "увелич",
];
const SAVINGS_KEYWORDS = ["подушк", "резерв", "накоп", "отлож", "сбереж"];

type TaskCategory = "debt" | "expense" | "income" | "savings" | "mixed";

function taskText(task: TaskForSimulation): string {
  return `${task.title} ${task.description ?? ""}`.toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function classifyTask(task: TaskForSimulation): TaskCategory {
  if (isInformationalFinancialTask(task.title, task.description)) {
    return "expense";
  }

  const text = taskText(task);
  const flags = {
    debt: containsAny(text, DEBT_KEYWORDS),
    expense: containsAny(text, EXPENSE_KEYWORDS),
    income: containsAny(text, INCOME_KEYWORDS),
    savings: containsAny(text, SAVINGS_KEYWORDS),
  };
  const count = Object.values(flags).filter(Boolean).length;
  if (count > 1) return "mixed";
  if (flags.debt) return "debt";
  if (flags.expense) return "expense";
  if (flags.income) return "income";
  if (flags.savings) return "savings";
  if (!hasQuantifiableFinancialEffect(task.title, task.description)) {
    return "expense";
  }
  return task.impact_score >= 60 ? "mixed" : "expense";
}

function extractRubAmount(text: string): number | null {
  const match = text.match(/(\d[\d\s]{0,8})\s*(₽|руб\.?|rub)/i);
  if (!match) return null;
  const value = Number(match[1].replace(/\s/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function calculateDebtLoadPercent(
  monthlyIncome: number,
  debtPayments: number,
  totalDebt: number
): number {
  if (monthlyIncome <= 0) return totalDebt > 0 ? 100 : 0;
  return Math.round(((debtPayments + totalDebt * 0.02) / monthlyIncome) * 100);
}

export function buildCurrentFinanceState(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): CurrentFinanceState {
  const summary = computeDashboardSummary(
    incomes,
    expenses,
    debts,
    profileType,
    profileIncome
  );
  return {
    financialIndex: summary.financialIndex,
    netCashFlow: summary.netCashFlow,
    monthlyIncome: summary.monthlyIncome,
    monthlyExpenses: summary.totalExpenses,
    debtPayments: summary.debtPayments,
    totalDebt: summary.totalDebt,
  };
}

function resolveLinkedGoal(
  task: TaskForSimulation,
  goals: FinancialGoal[]
): FinancialGoal | null {
  if (task.goal_id) {
    return goals.find((g) => g.id === task.goal_id) ?? null;
  }
  return pickPrimaryGoal(goals);
}

function monthsToGoal(
  goal: FinancialGoal | null,
  monthlyAllocation: number
): number | null {
  if (!goal) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return 0;
  if (monthlyAllocation <= 0) return null;
  return Math.ceil(remaining / monthlyAllocation);
}

function goalAllocationRatio(category: TaskCategory): number {
  if (category === "savings") return 0.85;
  if (category === "expense" || category === "debt") return 0.55;
  return 0.45;
}

function deriveAdjustments(
  task: TaskForSimulation,
  state: CurrentFinanceState,
  category: TaskCategory
): WhatIfInput {
  const factor = Math.min(1, Math.max(0.15, task.impact_score / 100));
  const text = taskText(task);
  const extracted = extractRubAmount(text);

  const base: WhatIfInput = {
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    debtPaymentChangePercent: 0,
    totalDebtChangePercent: 0,
  };

  switch (category) {
    case "debt":
      return {
        ...base,
        debtPaymentChangePercent: -(12 + 10 * factor),
        totalDebtChangePercent: -(5 + 6 * factor),
        expenseChangePercent: -(2 + 3 * factor),
      };
    case "expense": {
      const expenseCut =
        extracted && state.monthlyExpenses > 0
          ? Math.min(35, (extracted / state.monthlyExpenses) * 100)
          : 8 + 12 * factor;
      return { ...base, expenseChangePercent: -expenseCut };
    }
    case "income": {
      const incomeBoost =
        extracted && state.monthlyIncome > 0
          ? Math.min(30, (extracted / state.monthlyIncome) * 100)
          : 6 + 10 * factor;
      return { ...base, incomeChangePercent: incomeBoost };
    }
    case "savings":
      return {
        ...base,
        expenseChangePercent: -(4 + 6 * factor),
        incomeChangePercent: 2 + 4 * factor,
      };
    case "mixed":
    default:
      return {
        incomeChangePercent: 3 + 5 * factor,
        expenseChangePercent: -(6 + 8 * factor),
        debtPaymentChangePercent: state.debtPayments > 0 ? -(6 + 8 * factor) : 0,
        totalDebtChangePercent: state.totalDebt > 0 ? -(3 + 4 * factor) : 0,
      };
  }
}

function scaleIncomes(incomes: Income[], percent: number): Income[] {
  const factor = 1 + percent / 100;
  return incomes.map((i) => ({ ...i, amount: i.amount * factor }));
}

function scaleExpenses(expenses: Expense[], percent: number): Expense[] {
  const factor = 1 + percent / 100;
  return expenses.map((e) => ({ ...e, amount: e.amount * factor }));
}

function scaleDebts(debts: Debt[], paymentPercent: number, totalPercent: number): Debt[] {
  const paymentFactor = 1 + paymentPercent / 100;
  const totalFactor = 1 + totalPercent / 100;
  return debts.map((d) => ({
    ...d,
    minimum_payment: Math.max(0, d.minimum_payment * paymentFactor),
    calculated_monthly_payment:
      d.calculated_monthly_payment != null
        ? Math.max(0, d.calculated_monthly_payment * paymentFactor)
        : null,
    actual_monthly_payment:
      d.actual_monthly_payment != null
        ? Math.max(0, d.actual_monthly_payment * paymentFactor)
        : null,
    remaining_amount: Math.max(0, d.remaining_amount * totalFactor),
    total_amount: Math.max(d.remaining_amount, d.total_amount * totalFactor),
  }));
}

export function applyWhatIf(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  input: WhatIfInput,
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  summary: ReturnType<typeof computeDashboardSummary>;
} {
  const adjIncomes = scaleIncomes(incomes, input.incomeChangePercent);
  const adjExpenses = scaleExpenses(expenses, input.expenseChangePercent);
  const adjDebts = scaleDebts(
    debts,
    input.debtPaymentChangePercent,
    input.totalDebtChangePercent
  );
  const summary = computeDashboardSummary(
    adjIncomes,
    adjExpenses,
    adjDebts,
    profileType,
    profileIncome
  );

  return {
    incomes: adjIncomes,
    expenses: adjExpenses,
    debts: adjDebts,
    summary,
  };
}

function estimateConfidence(
  task: TaskForSimulation,
  state: CurrentFinanceState,
  category: TaskCategory
): number {
  let confidence = 42 + Math.round(task.impact_score * 0.38);
  if (task.goal_id) confidence += 8;
  if (extractRubAmount(taskText(task))) confidence += 6;
  if (state.financialIndex !== null) confidence += 5;
  if (category === "mixed") confidence -= 6;
  if (state.monthlyIncome <= 0) confidence -= 10;
  return Math.min(92, Math.max(35, confidence));
}

export function simulateWhatIf(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  goals: FinancialGoal[],
  input: WhatIfInput,
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): WhatIfResult {
  const { summary } = applyWhatIf(
    incomes,
    expenses,
    debts,
    input,
    profileType,
    profileIncome
  );
  const goal = pickPrimaryGoal(goals);
  const allocation = monthsToGoal(goal, summary.netCashFlow * 0.5);

  return {
    financialIndex: summary.financialIndex,
    netCashFlow: summary.netCashFlow,
    monthlyIncome: summary.monthlyIncome,
    monthlyExpenses: summary.totalExpenses,
    debtPayments: summary.debtPayments,
    totalDebt: summary.totalDebt,
    debtLoadPercent: calculateDebtLoadPercent(
      summary.monthlyIncome,
      summary.debtPayments,
      summary.totalDebt
    ),
    goalMonths: allocation,
    goalTitle: goal?.title ?? null,
  };
}

export function simulateTaskImpact(
  task: TaskForSimulation,
  currentFinanceState: CurrentFinanceState,
  goals: FinancialGoal[],
  options?: {
    incomes?: Income[];
    expenses?: Expense[];
    debts?: Debt[];
    profileType?: ProfileType;
    profileIncome?: ProfileIncomeParameters | null;
  }
): TaskImpactSimulation {
  if (!hasQuantifiableFinancialEffect(task.title, task.description)) {
    return {
      currentFinancialIndex: currentFinanceState.financialIndex,
      projectedFinancialIndex: currentFinanceState.financialIndex,
      currentCashflow: currentFinanceState.netCashFlow,
      projectedCashflow: currentFinanceState.netCashFlow,
      currentDebtLoad: calculateDebtLoadPercent(
        currentFinanceState.monthlyIncome,
        currentFinanceState.debtPayments,
        currentFinanceState.totalDebt
      ),
      projectedDebtLoad: calculateDebtLoadPercent(
        currentFinanceState.monthlyIncome,
        currentFinanceState.debtPayments,
        currentFinanceState.totalDebt
      ),
      currentGoalMonths: null,
      projectedGoalMonths: null,
      confidence: 0,
    };
  }

  const category = classifyTask(task);
  const linkedGoal = resolveLinkedGoal(task, goals);
  const allocationRatio = goalAllocationRatio(category);

  const currentDebtLoad = calculateDebtLoadPercent(
    currentFinanceState.monthlyIncome,
    currentFinanceState.debtPayments,
    currentFinanceState.totalDebt
  );

  const currentGoalMonths = monthsToGoal(
    linkedGoal,
    Math.max(0, currentFinanceState.netCashFlow) * allocationRatio
  );

  if (
    options?.incomes &&
    options?.expenses &&
    options?.debts &&
    options.incomes.length + options.expenses.length + options.debts.length > 0
  ) {
    const adjustments = deriveAdjustments(task, currentFinanceState, category);
    const { summary } = applyWhatIf(
      options.incomes,
      options.expenses,
      options.debts,
      adjustments,
      options.profileType,
      options.profileIncome ?? null
    );

    const projectedDebtLoad = calculateDebtLoadPercent(
      summary.monthlyIncome,
      summary.debtPayments,
      summary.totalDebt
    );

    const projectedGoalMonths = monthsToGoal(
      linkedGoal,
      Math.max(0, summary.netCashFlow) * allocationRatio
    );

    return {
      currentFinancialIndex: currentFinanceState.financialIndex,
      projectedFinancialIndex: summary.financialIndex,
      currentCashflow: currentFinanceState.netCashFlow,
      projectedCashflow: summary.netCashFlow,
      currentDebtLoad,
      projectedDebtLoad,
      currentGoalMonths,
      projectedGoalMonths,
      confidence: estimateConfidence(task, currentFinanceState, category),
    };
  }

  const factor = Math.min(1, Math.max(0.15, task.impact_score / 100));
  let cashflowDelta = 0;
  let indexDelta = 0;
  let debtLoadDelta = 0;

  switch (category) {
    case "debt":
      cashflowDelta = Math.round(
        currentFinanceState.debtPayments * (0.1 + 0.12 * factor) +
          currentFinanceState.monthlyExpenses * 0.03 * factor
      );
      indexDelta = Math.round(6 + 12 * factor);
      debtLoadDelta = -(8 + 12 * factor);
      break;
    case "expense":
      cashflowDelta = Math.round(
        currentFinanceState.monthlyExpenses * (0.06 + 0.1 * factor)
      );
      indexDelta = Math.round(4 + 9 * factor);
      debtLoadDelta = -(3 + 5 * factor);
      break;
    case "income":
      cashflowDelta = Math.round(
        currentFinanceState.monthlyIncome * (0.05 + 0.08 * factor)
      );
      indexDelta = Math.round(5 + 10 * factor);
      break;
    case "savings":
      cashflowDelta = Math.round(
        currentFinanceState.monthlyExpenses * 0.04 * factor +
          currentFinanceState.monthlyIncome * 0.02 * factor
      );
      indexDelta = Math.round(3 + 7 * factor);
      break;
    default:
      cashflowDelta = Math.round(
        currentFinanceState.netCashFlow * 0.08 * factor +
          currentFinanceState.monthlyExpenses * 0.05 * factor
      );
      indexDelta = Math.round(5 + 11 * factor);
      debtLoadDelta = -(4 + 7 * factor);
  }

  const extracted = extractRubAmount(taskText(task));
  if (extracted) {
    cashflowDelta = Math.max(cashflowDelta, Math.round(extracted * 0.7));
  }

  const projectedCashflow = currentFinanceState.netCashFlow + cashflowDelta;
  const projectedIndex =
    currentFinanceState.financialIndex !== null
      ? Math.min(100, currentFinanceState.financialIndex + indexDelta)
      : null;

  const projectedDebtLoad = Math.max(
    0,
    Math.min(100, currentDebtLoad + debtLoadDelta)
  );

  const projectedGoalMonths = monthsToGoal(
    linkedGoal,
    Math.max(0, projectedCashflow) * allocationRatio
  );

  return {
    currentFinancialIndex: currentFinanceState.financialIndex,
    projectedFinancialIndex: projectedIndex,
    currentCashflow: currentFinanceState.netCashFlow,
    projectedCashflow: projectedCashflow,
    currentDebtLoad,
    projectedDebtLoad,
    currentGoalMonths,
    projectedGoalMonths,
    confidence: estimateConfidence(task, currentFinanceState, category),
  };
}

export function getImpactDeltas(impact: TaskImpactSimulation) {
  return {
    indexDelta:
      impact.currentFinancialIndex !== null &&
      impact.projectedFinancialIndex !== null
        ? impact.projectedFinancialIndex - impact.currentFinancialIndex
        : null,
    cashflowDelta: impact.projectedCashflow - impact.currentCashflow,
    goalMonthsDelta:
      impact.currentGoalMonths !== null && impact.projectedGoalMonths !== null
        ? impact.currentGoalMonths - impact.projectedGoalMonths
        : null,
    debtLoadDelta: impact.projectedDebtLoad - impact.currentDebtLoad,
  };
}
