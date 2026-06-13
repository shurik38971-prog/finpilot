create table if not exists public.tester_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  contact text,
  clarity text,
  useful_parts text[] not null default '{}',
  useful_parts_other text,
  resonated_moment text,
  confusing_parts text,
  next_steps_clear text,
  missing_to_return text,
  paid_value_parts text[] not null default '{}',
  paid_value_parts_other text,
  answers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tester_feedback_created_at_idx
  on public.tester_feedback(created_at desc);

create index if not exists tester_feedback_user_id_idx
  on public.tester_feedback(user_id);

alter table public.tester_feedback enable row level security;

drop policy if exists "Users can insert tester feedback" on public.tester_feedback;
create policy "Users can insert tester feedback"
  on public.tester_feedback
  for insert
  to authenticated, anon
  with check (true);

drop policy if exists "Admins read tester feedback" on public.tester_feedback;
create policy "Admins read tester feedback"
  on public.tester_feedback
  for select
  to authenticated
  using (public.is_finpilot_admin());
