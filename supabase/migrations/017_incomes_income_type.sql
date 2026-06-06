alter table public.incomes
add column if not exists income_type text
check (income_type in ('expected', 'actual'));

update public.incomes
set income_type = 'expected'
where income_type is null
  and is_recurring = true;

update public.incomes
set income_type = 'actual'
where income_type is null
  and is_recurring = false;

update public.incomes
set income_type = 'actual'
where income_type is null;

create index if not exists incomes_income_type_idx
on public.incomes(user_id, income_type);
