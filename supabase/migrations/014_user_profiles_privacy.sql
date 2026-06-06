-- Профиль пользователя: согласие на обработку ПДн

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  privacy_accepted boolean not null default false,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_privacy_accepted_idx
  on public.user_profiles(privacy_accepted);

alter table public.user_profiles enable row level security;

drop policy if exists "Users read own profile" on public.user_profiles;
create policy "Users read own profile"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own profile" on public.user_profiles;
create policy "Users insert own profile"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.user_profiles;
create policy "Users update own profile"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted boolean;
  accepted_at timestamptz;
begin
  accepted := coalesce((new.raw_user_meta_data->>'privacy_accepted')::boolean, false);
  accepted_at := nullif(new.raw_user_meta_data->>'privacy_accepted_at', '')::timestamptz;

  if accepted and accepted_at is null then
    accepted_at := now();
  end if;

  insert into public.user_profiles (user_id, privacy_accepted, privacy_accepted_at)
  values (new.id, accepted, accepted_at)
  on conflict (user_id) do update set
    privacy_accepted = excluded.privacy_accepted,
    privacy_accepted_at = coalesce(excluded.privacy_accepted_at, public.user_profiles.privacy_accepted_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
