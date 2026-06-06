export interface ProfileIncomeParameters {
  /** Derived base income; not entered manually — computed from bad/good or history. */
  averageMonthly: number | null;
  badMonth: number | null;
  goodMonth: number | null;
  /** Salary, pension or business average saved on profile during onboarding. */
  storedExpectedMonthly: number | null;
}

export const EMPTY_PROFILE_INCOME_PARAMETERS: ProfileIncomeParameters = {
  averageMonthly: null,
  badMonth: null,
  goodMonth: null,
  storedExpectedMonthly: null,
};

export function deriveBaseIncomeFromProfile(
  params: ProfileIncomeParameters | null | undefined
): number | null {
  const bad = params?.badMonth ?? 0;
  const good = params?.goodMonth ?? 0;
  if (bad <= 0 || good <= 0 || good < bad) {
    return null;
  }
  return Math.round((bad + good) / 2);
}

export function hasProfileIncomeParameters(
  params: ProfileIncomeParameters | null | undefined
): boolean {
  const bad = params?.badMonth ?? 0;
  const good = params?.goodMonth ?? 0;
  return bad > 0 && good > 0 && good >= bad;
}

export function hasStoredProfileExpectedIncome(
  params: ProfileIncomeParameters | null | undefined
): boolean {
  return (params?.storedExpectedMonthly ?? 0) > 0;
}

export function hasAnyProfileIncomeExpectation(
  params: ProfileIncomeParameters | null | undefined
): boolean {
  return hasProfileIncomeParameters(params) || hasStoredProfileExpectedIncome(params);
}

type ProfileIncomeRow = {
  average_month_income?: number | null;
  bad_month_income?: number | null;
  good_month_income?: number | null;
  expected_monthly_income?: number | null;
  income_average_monthly?: number | null;
  income_bad_month?: number | null;
  income_good_month?: number | null;
} | null;

export function mapProfileIncomeRow(row: ProfileIncomeRow): ProfileIncomeParameters {
  if (!row) return { ...EMPTY_PROFILE_INCOME_PARAMETERS };

  const badMonth = row.bad_month_income ?? row.income_bad_month ?? null;
  const goodMonth = row.good_month_income ?? row.income_good_month ?? null;
  const derived = deriveBaseIncomeFromProfile({
    averageMonthly: null,
    badMonth,
    goodMonth,
    storedExpectedMonthly: null,
  });
  const storedAverage =
    row.average_month_income ?? row.income_average_monthly ?? null;

  return {
    badMonth,
    goodMonth,
    averageMonthly: derived ?? storedAverage,
    storedExpectedMonthly: row.expected_monthly_income ?? null,
  };
}
