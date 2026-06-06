alter table public.incomes
  add column if not exists is_additional boolean not null default true;

alter table public.user_profiles
  add column if not exists use_actual_income_only boolean not null default false;

-- Legacy primary incomes from onboarding (now stored on profile only).
update public.incomes
set is_additional = false
where
  is_profile_parameter = true
  or title in (
    'Зарплата',
    'Пенсия',
    'Средний доход бизнеса',
    'Средний доход',
    'Средний месяц',
    'Плохой месяц',
    'Хороший месяц'
  );
