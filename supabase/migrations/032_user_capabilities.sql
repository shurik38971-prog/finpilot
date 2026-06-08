create table if not exists public.user_capabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_work text,
  skills text[] not null default '{}',
  available_hours_per_week integer,
  constraints text[] not null default '{}',
  preferred_format text,
  target_result text,
  primary_goal text,
  secondary_goals text[] not null default '{}',
  last_plan jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists user_capabilities_user_id_idx
  on public.user_capabilities(user_id);

alter table public.user_capabilities enable row level security;

drop policy if exists "Users manage own capabilities" on public.user_capabilities;
create policy "Users manage own capabilities"
  on public.user_capabilities for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
