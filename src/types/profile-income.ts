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

export function mapProfileIncomeRow(row: {
  income_average_monthly: number | null;
  income_bad_month: number | null;
  income_good_month: number | null;
} | null): ProfileIncomeParameters {
  if (!row) return { ...EMPTY_PROFILE_INCOME_PARAMETERS };

  return {
    averageMonthly: row.income_average_monthly,
    badMonth: row.income_bad_month,
    goodMonth: row.income_good_month,
  };
}
