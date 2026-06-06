alter table public.user_profiles
  add column if not exists average_month_income numeric
    check (average_month_income is null or average_month_income >= 0),
  add column if not exists bad_month_income numeric
    check (bad_month_income is null or bad_month_income >= 0),
  add column if not exists good_month_income numeric
    check (good_month_income is null or good_month_income >= 0);

update public.user_profiles
set
  average_month_income = coalesce(average_month_income, income_average_monthly),
  bad_month_income = coalesce(bad_month_income, income_bad_month),
  good_month_income = coalesce(good_month_income, income_good_month)
where
  income_average_monthly is not null
  or income_bad_month is not null
  or income_good_month is not null;

with legacy_params as (
  select
    i.user_id,
    max(
      case
        when lower(i.title) like '%плох%' then i.amount
      end
    ) as bad_month_income,
    max(
      case
        when lower(i.title) like '%средн%' then i.amount
      end
    ) as average_month_income,
    max(
      case
        when lower(i.title) like '%хорош%' then i.amount
      end
    ) as good_month_income
  from public.incomes i
  where
    i.is_profile_parameter = true
    or (
      i.category = 'freelance'
      and i.title in (
        'Плохой месяц',
        'Средний доход',
        'Средний месяц',
        'Хороший месяц'
      )
    )
  group by i.user_id
)
update public.user_profiles up
set
  average_month_income = coalesce(up.average_month_income, lp.average_month_income),
  bad_month_income = coalesce(up.bad_month_income, lp.bad_month_income),
  good_month_income = coalesce(up.good_month_income, lp.good_month_income),
  updated_at = now()
from legacy_params lp
where up.user_id = lp.user_id;

delete from public.incomes
where
  is_profile_parameter = true
  or title in (
    'Плохой месяц',
    'Средний доход',
    'Средний месяц',
    'Хороший месяц'
  );
