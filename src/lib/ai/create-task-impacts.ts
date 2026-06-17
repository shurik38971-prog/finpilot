import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCurrentFinanceState,
  simulateTaskImpact,
  type TaskForSimulation,
} from "@/lib/services/impact-simulator";
import type { Debt, Expense, Income } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import { hasQuantifiableFinancialEffect } from "@/lib/finance/task-effect-eligibility";
import { safeLogError } from "@/lib/logging/safe-log";
import type { TaskImpactSimulation } from "@/types/task-impact";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import type { ProfileType } from "@/types/profile";

interface InsertedTask extends TaskForSimulation {
  id: string;
}

export function simulationToImpactRow(
  taskId: string,
  simulation: TaskImpactSimulation
) {
  return {
    task_id: taskId,
    current_index: simulation.currentFinancialIndex,
    projected_index: simulation.projectedFinancialIndex,
    current_cashflow: simulation.currentCashflow,
    projected_cashflow: simulation.projectedCashflow,
    current_goal_months: simulation.currentGoalMonths,
    projected_goal_months: simulation.projectedGoalMonths,
    confidence: simulation.confidence,
  };
}

export async function createTaskImpacts(
  supabase: SupabaseClient,
  _userId: string,
  insertedTasks: InsertedTask[],
  options: {
    incomes: Income[];
    expenses: Expense[];
    debts: Debt[];
    goals: FinancialGoal[];
    profileType?: ProfileType;
    profileIncome?: ProfileIncomeParameters | null;
  }
): Promise<number> {
  if (insertedTasks.length === 0) return 0;

  const financeState = buildCurrentFinanceState(
    options.incomes,
    options.expenses,
    options.debts,
    options.profileType,
    options.profileIncome ?? null
  );

  const quantifiableTasks = insertedTasks.filter((task) =>
    hasQuantifiableFinancialEffect(task.title, task.description)
  );

  if (quantifiableTasks.length === 0) return 0;

  const rows = quantifiableTasks.map((task) => {
    const simulation = simulateTaskImpact(task, financeState, options.goals, {
      incomes: options.incomes,
      expenses: options.expenses,
      debts: options.debts,
      profileType: options.profileType,
      profileIncome: options.profileIncome ?? null,
    });
    return simulationToImpactRow(task.id, simulation);
  });

  const { error } = await supabase.from("task_impacts").insert(rows);
  if (error) {
    console.error("Failed to create task impacts:", safeLogError(error));
    return 0;
  }

  return rows.length;
}

export async function refreshTaskImpacts(
  supabase: SupabaseClient,
  userId: string,
  tasks: InsertedTask[],
  options: {
    incomes: Income[];
    expenses: Expense[];
    debts: Debt[];
    goals: FinancialGoal[];
    profileType?: ProfileType;
    profileIncome?: ProfileIncomeParameters | null;
  }
): Promise<void> {
  if (tasks.length === 0) return;

  const taskIds = tasks.map((task) => task.id);
  await supabase.from("task_impacts").delete().in("task_id", taskIds);

  await createTaskImpacts(supabase, userId, tasks, options);
}
