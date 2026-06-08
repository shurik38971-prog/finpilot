create table if not exists public.user_escape_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  option_title text not null,
  option_snapshot jsonb not null default '{}',
  status text not null default 'active'
    check (status in ('planned', 'active', 'completed', 'abandoned')),
  follow_up_due_at timestamptz,
  follow_up_answer text
    check (follow_up_answer is null or follow_up_answer in ('yes', 'partial', 'no')),
  follow_up_answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_escape_plans_user_id_idx
  on public.user_escape_plans(user_id);

create index if not exists user_escape_plans_status_idx
  on public.user_escape_plans(user_id, status);

alter table public.user_escape_plans enable row level security;

drop policy if exists "Users manage own escape plans" on public.user_escape_plans;
create policy "Users manage own escape plans"
  on public.user_escape_plans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
