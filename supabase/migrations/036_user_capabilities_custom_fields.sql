alter table public.user_capabilities
  add column if not exists custom_skills text[] not null default '{}',
  add column if not exists custom_goal text,
  add column if not exists custom_restriction text;
