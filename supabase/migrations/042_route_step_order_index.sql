alter table public.financial_tasks
  add column if not exists order_index integer;

create index if not exists financial_tasks_escape_plan_order_idx
  on public.financial_tasks (escape_plan_id, order_index)
  where escape_plan_id is not null;

update public.financial_tasks
set order_index = (regexp_match(normalized_title, '^escape:[^:]+:(\d+)$'))[1]::integer + 1
where escape_plan_id is not null
  and order_index is null
  and normalized_title ~ '^escape:[^:]+:\d+$';
