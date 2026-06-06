alter table public.user_profiles
  add column if not exists income_average_monthly numeric
    check (income_average_monthly is null or income_average_monthly >= 0),
  add column if not exists income_bad_month numeric
    check (income_bad_month is null or income_bad_month >= 0),
  add column if not exists income_good_month numeric
    check (income_good_month is null or income_good_month >= 0);

alter table public.incomes
  add column if not exists is_profile_parameter boolean not null default false;

create index if not exists incomes_user_operational_idx
  on public.incomes(user_id)
  where is_profile_parameter = false;

with legacy_params as (
  select
    i.user_id,
    max(case when i.title = 'Средний доход' then i.amount end) as income_average_monthly,
    max(case when i.title = 'Плохой месяц' then i.amount end) as income_bad_month,
    max(case when i.title = 'Хороший месяц' then i.amount end) as income_good_month
  from public.incomes i
  where i.title in ('Средний доход', 'Плохой месяц', 'Хороший месяц')
  group by i.user_id
)
update public.user_profiles up
set
  income_average_monthly = coalesce(up.income_average_monthly, lp.income_average_monthly),
  income_bad_month = coalesce(up.income_bad_month, lp.income_bad_month),
  income_good_month = coalesce(up.income_good_month, lp.income_good_month),
  updated_at = now()
from legacy_params lp
where up.user_id = lp.user_id;

delete from public.incomes
where title in ('Средний доход', 'Плохой месяц', 'Хороший месяц');
