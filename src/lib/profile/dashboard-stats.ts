import { getMonthlyFinanceSummary } from "@/lib/finance/monthly-summary";
import type { Debt, Expense, Income } from "@/types/database";
import type { FinancialGoal } from "@/types/goals";
import type { ProfileType } from "@/types/profile";
import { PROFILE_TYPE_LABELS } from "@/types/profile";
import { formatCurrency } from "@/lib/utils";

export interface ProfileStatItem {
  label: string;
  value: string;
}

export interface ProfileDashboardStatsData {
  title: string;
  items: ProfileStatItem[];
}

function formatMonths(months: number | null): string {
  if (months === null || !Number.isFinite(months)) return "—";
  if (months <= 0) return "0 мес";
  if (months < 1) return "< 1 мес";
  const rounded = Math.round(months * 10) / 10;
  return `${rounded} мес`;
}

export function computeProfileDashboardStats(
  profileType: ProfileType,
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  goals: FinancialGoal[]
): ProfileDashboardStatsData {
  const summary = getMonthlyFinanceSummary(incomes, expenses, debts);
  const monthlyBurn = summary.recurringExpenses + summary.debtPayments;
  const burnBase =
    monthlyBurn > 0 ? monthlyBurn : summary.totalExpenses + summary.debtPayments;

  const cushionGoal = goals.find((g) => g.type === "safety_cushion");
  const cushionAmount = cushionGoal?.current_amount ?? 0;

  const savingsTotal = goals
    .filter((g) => g.type === "safety_cushion" || g.type === "custom")
    .reduce((sum, g) => sum + g.current_amount, 0);

  const monthsCovered = burnBase > 0 ? cushionAmount / burnBase : null;

  const reserveMonths =
    profileType === "freelancer"
      ? 6
      : profileType === "business_owner"
        ? 4
        : 3;
  const recommendedReserve = Math.round(burnBase * reserveMonths);

  const liquidity = cushionAmount + Math.max(0, summary.freeMoney);

  switch (profileType) {
    case "freelancer":
      return {
        title: PROFILE_TYPE_LABELS[profileType],
        items: [
          {
            label: "Рекомендуемый резерв",
            value: formatCurrency(recommendedReserve),
          },
          { label: "Размер подушки", value: formatCurrency(cushionAmount) },
          { label: "Хватит на", value: formatMonths(monthsCovered) },
        ],
      };
    case "employee":
      return {
        title: PROFILE_TYPE_LABELS.employee,
        items: [
          { label: "Подушка", value: formatCurrency(cushionAmount) },
          { label: "Накопления", value: formatCurrency(savingsTotal) },
        ],
      };
    case "retiree":
      return {
        title: PROFILE_TYPE_LABELS.retiree,
        items: [{ label: "Запас средств", value: formatCurrency(cushionAmount) }],
      };
    case "business_owner":
      return {
        title: PROFILE_TYPE_LABELS.business_owner,
        items: [{ label: "Ликвидность", value: formatCurrency(liquidity) }],
      };
  }
}
