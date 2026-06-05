-- Один анализ в день, короткие метки, следующий шаг

alter table public.analyses
add column if not exists analysis_date date;

alter table public.analyses
add column if not exists main_problem_short text;

alter table public.analyses
add column if not exists next_step text;

update public.analyses
set analysis_date = (created_at at time zone 'UTC')::date
where analysis_date is null;

create index if not exists analyses_user_date_idx
on public.analyses(user_id, analysis_date desc);

-- Финансовые цели

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('safety_cushion', 'debt_payoff', 'custom')),
  title text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  debt_id uuid references public.debts(id) on delete set null,
  deadline date,
  created_at timestamptz not null default now()
);

create index if not exists financial_goals_user_id_idx
on public.financial_goals(user_id);

alter table public.financial_goals enable row level security;

drop policy if exists "Users manage own goals" on public.financial_goals;

create policy "Users manage own goals"
  on public.financial_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
