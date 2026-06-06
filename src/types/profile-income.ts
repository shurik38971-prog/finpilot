export interface ProfileIncomeParameters {
  averageMonthly: number | null;
  badMonth: number | null;
  goodMonth: number | null;
}

export const EMPTY_PROFILE_INCOME_PARAMETERS: ProfileIncomeParameters = {
  averageMonthly: null,
  badMonth: null,
  goodMonth: null,
};

export function hasProfileIncomeParameters(
  params: ProfileIncomeParameters | null | undefined
): boolean {
  return (params?.averageMonthly ?? 0) > 0;
}

type ProfileIncomeRow = {
  average_month_income?: number | null;
  bad_month_income?: number | null;
  good_month_income?: number | null;
  income_average_monthly?: number | null;
  income_bad_month?: number | null;
  income_good_month?: number | null;
} | null;

export function mapProfileIncomeRow(row: ProfileIncomeRow): ProfileIncomeParameters {
  if (!row) return { ...EMPTY_PROFILE_INCOME_PARAMETERS };

  return {
    averageMonthly:
      row.average_month_income ?? row.income_average_monthly ?? null,
    badMonth: row.bad_month_income ?? row.income_bad_month ?? null,
    goodMonth: row.good_month_income ?? row.income_good_month ?? null,
  };
}

export function getExpectedMonthlyIncome(
  params: ProfileIncomeParameters | null | undefined
): number | null {
  const average = params?.averageMonthly ?? 0;
  return average > 0 ? average : null;
}

export function getIncomeGap(
  actualCurrentMonth: number,
  params: ProfileIncomeParameters | null | undefined
): number | null {
  const expected = getExpectedMonthlyIncome(params);
  if (expected === null) return null;
  return expected - actualCurrentMonth;
}

export function getVariableIncomeComparisonLabel(
  actualCurrentMonth: number,
  params: ProfileIncomeParameters | null | undefined
): string | null {
  const expected = getExpectedMonthlyIncome(params);
  if (expected === null || expected <= 0) return null;
  if (actualCurrentMonth > expected) return "Доход выше обычного месяца";
  if (actualCurrentMonth < expected) return "Доход ниже обычного месяца";
  return null;
}

export function toAnalysisIncomeFields(
  params: ProfileIncomeParameters | null | undefined,
  actualCurrentMonth: number
) {
  const average = getExpectedMonthlyIncome(params);
  const gap = getIncomeGap(actualCurrentMonth, params);

  return {
    bad_month_income: params?.badMonth ?? null,
    average_month_income: average,
    good_month_income: params?.goodMonth ?? null,
    expected_monthly_income: average,
    actual_income_current_month: actualCurrentMonth,
    income_gap: gap,
  };
}
