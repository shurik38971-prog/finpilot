import type { Income } from "@/types/database";

export const PROFILE_PARAMETER_INCOME_TITLES = new Set([
  "Средний доход",
  "Средний месяц",
  "Плохой месяц",
  "Хороший месяц",
]);

export const PRIMARY_INCOME_TITLES = new Set([
  "Зарплата",
  "Пенсия",
  "Средний доход бизнеса",
]);

export function isProfileParameterIncome(income: Income): boolean {
  if ("is_profile_parameter" in income && income.is_profile_parameter) {
    return true;
  }

  return PROFILE_PARAMETER_INCOME_TITLES.has(income.title);
}

export function isPrimaryIncome(income: Income): boolean {
  if (income.is_additional === true) return false;
  if (income.is_additional === false) return true;
  return PRIMARY_INCOME_TITLES.has(income.title);
}

export function filterOperationalIncomes(incomes: Income[]): Income[] {
  return incomes.filter((income) => !isProfileParameterIncome(income));
}

/** Incomes shown in the «Доходы» section — supplementary sources only. */
export function filterAdditionalIncomes(incomes: Income[]): Income[] {
  return filterOperationalIncomes(incomes).filter(
    (income) => !isPrimaryIncome(income)
  );
}
