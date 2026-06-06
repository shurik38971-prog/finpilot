import { actualIncomeInMonth, expectedIncomeInMonth } from "@/lib/finance/income-model";
import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";
import { resolveMonthlyIncome } from "@/lib/finance/monthly-income";
import type { ProfileIncomeParameters } from "@/types/profile-income";
import {
  DEFAULT_PROFILE_TYPE,
  type ProfileType,
} from "@/types/profile";
import { toMonthlyAmount } from "@/lib/utils";
import type { Debt, Expense, Income } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";

function reserveTargetMonths(profileType: ProfileType): number {
  if (profileType === "freelancer" || profileType === "self_employed") return 6;
  if (profileType === "business_owner") return 4;
  return 3;
}

export function getPrimaryFinancialRisk(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  goals: FinancialGoal[],
  profileType: ProfileType = DEFAULT_PROFILE_TYPE,
  profileIncome: ProfileIncomeParameters | null = null
): string | null {
  const summary = getMonthlyFinanceSummary(incomes, expenses, debts);
  const monthlyIncome = resolveMonthlyIncome(
    profileType,
    incomes,
    profileIncome
  ).monthlyIncome;
  const freeMoney =
    monthlyIncome - summary.totalExpenses - summary.debtPayments;
  const monthlyBurn = summary.recurringExpenses + summary.debtPayments;
  const burnBase =
    monthlyBurn > 0 ? monthlyBurn : summary.totalExpenses + summary.debtPayments;

  const risks: { severity: number; label: string }[] = [];

  if (freeMoney < 0) {
    risks.push({ severity: 100, label: "Нехватка свободных денег" });
  }

  if (monthlyIncome > 0) {
    const debtShare = (summary.debtPayments + summary.totalDebt * 0.02) / monthlyIncome;
    if (debtShare >= 0.2) {
      risks.push({
        severity: 70 + Math.min(30, debtShare * 40),
        label: "Высокая долговая нагрузка",
      });
    }
  } else if (summary.totalDebt > 0) {
    risks.push({ severity: 85, label: "Высокая долговая нагрузка" });
  }

  const cushionGoal = goals.find((goal) => goal.type === "safety_cushion");
  const cushionAmount = cushionGoal?.current_amount ?? 0;
  const targetMonths = reserveTargetMonths(profileType);
  const monthsCovered = burnBase > 0 ? cushionAmount / burnBase : null;

  if (monthsCovered !== null && monthsCovered < targetMonths) {
    risks.push({
      severity: 65 + Math.max(0, (targetMonths - monthsCovered) * 8),
      label: "Недостаток резервов",
    });
  } else if (
    cushionAmount === 0 &&
    summary.freeMoney >= 0 &&
    summary.freeMoney < burnBase
  ) {
    risks.push({ severity: 55, label: "Недостаток резервов" });
  }

  const now = new Date();
  const expected = expectedIncomeInMonth(incomes, now);
  const actual = actualIncomeInMonth(incomes, now);
  if (
    (profileType === "freelancer" || profileType === "self_employed") &&
    expected > 0 &&
    actual < expected * 0.75
  ) {
    risks.push({ severity: 50, label: "Нестабильный доход" });
  }

  if (monthlyIncome > 0) {
    const essential = expenses
      .filter((expense) => expense.is_essential && expense.is_recurring)
      .reduce(
        (sum, expense) =>
          sum + toMonthlyAmount(expense.amount, expense.frequency, true),
        0
      );
    if (essential / monthlyIncome > 0.7) {
      risks.push({ severity: 45, label: "Высокая доля обязательных расходов" });
    }
  }

  risks.sort((a, b) => b.severity - a.severity);
  return risks[0]?.label ?? null;
}
