alter table public.user_escape_plans
  add column if not exists attempt_status text not null default 'not_started'
    check (attempt_status in ('not_started', 'in_progress', 'success', 'failed')),
  add column if not exists failure_reason text
    check (
      failure_reason is null
      or failure_reason in ('no_clients', 'no_portfolio', 'no_time', 'other')
    ),
  add column if not exists failure_reason_other text,
  add column if not exists active_goal text,
  add column if not exists income_found integer not null default 0;

alter table public.user_capabilities
  add column if not exists last_rescue_plan jsonb;

update public.user_escape_plans
set attempt_status = 'in_progress'
where status = 'active' and attempt_status = 'not_started';

update public.user_escape_plans
set attempt_status = 'success'
where status = 'completed' and attempt_status = 'not_started';

update public.user_escape_plans
set attempt_status = 'failed'
where status = 'abandoned' and attempt_status = 'not_started';
