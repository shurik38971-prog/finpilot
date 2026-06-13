alter table public.user_escape_plans
  drop constraint if exists user_escape_plans_status_check;

alter table public.user_escape_plans
  add constraint user_escape_plans_status_check
  check (
    status in (
      'planned',
      'active',
      'alternative',
      'archived',
      'completed',
      'abandoned'
    )
  );

update public.user_escape_plans
set status = 'archived'
where status = 'abandoned';
