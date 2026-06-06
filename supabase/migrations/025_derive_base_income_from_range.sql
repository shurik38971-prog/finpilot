-- Base income is derived from bad/good range, not entered manually.
update public.user_profiles
set
  average_month_income = round(
    (coalesce(bad_month_income, income_bad_month, 0) +
      coalesce(good_month_income, income_good_month, 0)) / 2.0
  ),
  updated_at = now()
where
  coalesce(bad_month_income, income_bad_month, 0) > 0
  and coalesce(good_month_income, income_good_month, 0) >
    coalesce(bad_month_income, income_bad_month, 0);
