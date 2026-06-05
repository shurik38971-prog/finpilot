alter table public.analyses
add column if not exists financial_index integer;

alter table public.analyses
add column if not exists main_problem text;

alter table public.analyses
add column if not exists recommendations jsonb not null default '{}';

alter table public.analyses
add column if not exists model_used text;

create index if not exists analyses_user_id_idx
on public.analyses(user_id);

create index if not exists analyses_created_at_idx
on public.analyses(created_at desc);

alter table public.analyses enable row level security;

drop policy if exists "Users manage own analyses" on public.analyses;

create policy "Users manage own analyses"
  on public.analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);