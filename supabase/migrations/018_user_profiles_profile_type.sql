alter table public.user_profiles
add column if not exists profile_type text
check (profile_type in ('employee', 'freelancer', 'business_owner', 'retiree'));

create index if not exists user_profiles_profile_type_idx
on public.user_profiles(profile_type);

update public.user_profiles
set profile_type = 'freelancer'
where profile_type is null;

-- onboarding_progress is created in 011; create if that migration was skipped
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  income_done boolean not null default false,
  expenses_done boolean not null default false,
  debts_done boolean not null default false,
  goal_done boolean not null default false,
  analysis_done boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_progress_user_id_idx
  on public.onboarding_progress(user_id);

alter table public.onboarding_progress enable row level security;

drop policy if exists "Users manage own onboarding progress" on public.onboarding_progress;
create policy "Users manage own onboarding progress"
  on public.onboarding_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.onboarding_progress
add column if not exists profile_done boolean not null default false;

update public.onboarding_progress
set profile_done = true
where profile_done = false;
