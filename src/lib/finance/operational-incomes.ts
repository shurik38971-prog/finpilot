import type { Income } from "@/types/database";

export const PROFILE_PARAMETER_INCOME_TITLES = new Set([
  "Средний доход",
  "Плохой месяц",
  "Хороший месяц",
]);

export function isProfileParameterIncome(income: Income): boolean {
  if ("is_profile_parameter" in income && income.is_profile_parameter) {
    return true;
  }

  return PROFILE_PARAMETER_INCOME_TITLES.has(income.title);
}

export function filterOperationalIncomes(incomes: Income[]): Income[] {
  return incomes.filter((income) => !isProfileParameterIncome(income));
}
