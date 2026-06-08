alter table public.financial_tasks
  add column if not exists escape_plan_id uuid
    references public.user_escape_plans(id) on delete cascade;

create index if not exists financial_tasks_escape_plan_id_idx
  on public.financial_tasks(escape_plan_id)
  where escape_plan_id is not null;
