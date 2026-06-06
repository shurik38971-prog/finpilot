-- Продуктовая аналитика для первых пользователей

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx
  on public.analytics_events(user_id);

create index if not exists analytics_events_event_name_idx
  on public.analytics_events(event_name);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events(created_at desc);

create index if not exists analytics_events_user_event_idx
  on public.analytics_events(user_id, event_name);

create table if not exists public.task_recommendation_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.financial_tasks(id) on delete set null,
  rating text not null check (rating in ('strongly', 'slightly', 'no')),
  created_at timestamptz not null default now()
);

create index if not exists task_recommendation_ratings_user_id_idx
  on public.task_recommendation_ratings(user_id);

create index if not exists task_recommendation_ratings_created_at_idx
  on public.task_recommendation_ratings(created_at desc);

create table if not exists public.analysis_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists analysis_ratings_user_created_idx
  on public.analysis_ratings(user_id, created_at desc);

alter table public.analytics_events enable row level security;
alter table public.task_recommendation_ratings enable row level security;
alter table public.analysis_ratings enable row level security;

drop policy if exists "Users insert own analytics events" on public.analytics_events;
create policy "Users insert own analytics events"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Admins read analytics events" on public.analytics_events;
create policy "Admins read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.is_finpilot_admin());

drop policy if exists "Users manage own task recommendation ratings" on public.task_recommendation_ratings;
create policy "Users manage own task recommendation ratings"
  on public.task_recommendation_ratings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read task recommendation ratings" on public.task_recommendation_ratings;
create policy "Admins read task recommendation ratings"
  on public.task_recommendation_ratings for select
  to authenticated
  using (public.is_finpilot_admin());

drop policy if exists "Users manage own analysis ratings" on public.analysis_ratings;
create policy "Users manage own analysis ratings"
  on public.analysis_ratings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read analysis ratings" on public.analysis_ratings;
create policy "Admins read analysis ratings"
  on public.analysis_ratings for select
  to authenticated
  using (public.is_finpilot_admin());
