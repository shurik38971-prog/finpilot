alter table public.financial_tasks
add column if not exists task_category text;

create index if not exists financial_tasks_category_idx
on public.financial_tasks(user_id, task_category, status);

comment on column public.financial_tasks.status is
  'pending | done | postponed | archived';
