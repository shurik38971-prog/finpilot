alter table public.user_profiles
  add column if not exists expected_monthly_income numeric
    check (expected_monthly_income is null or expected_monthly_income >= 0);

-- Backfill salary / pension / business baseline from recurring expected incomes.
with recurring_expected as (
  select
    i.user_id,
    sum(
      case
        when coalesce(i.income_type, case when i.is_recurring then 'expected' else 'actual' end) = 'expected'
          and i.is_recurring
          and i.frequency is not null
        then
          case i.frequency
            when 'weekly' then i.amount * 4.33
            when 'twice_monthly' then i.amount * 2
            else i.amount
          end
        else 0
      end
    ) as monthly_total
  from public.incomes i
  where coalesce(i.is_profile_parameter, false) = false
  group by i.user_id
)
update public.user_profiles up
set
  expected_monthly_income = coalesce(up.expected_monthly_income, re.monthly_total),
  updated_at = now()
from recurring_expected re
where
  up.user_id = re.user_id
  and re.monthly_total > 0;
