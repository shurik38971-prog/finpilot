-- Обновление опроса после анализа + кампании реактивации

alter table public.feedback
  add column if not exists most_useful_feature text,
  add column if not exists took_action boolean default false,
  add column if not exists action_description text,
  add column if not exists missing_feature text,
  add column if not exists lost_value_text text;

alter table public.feedback drop column if exists usefulness_score;
alter table public.feedback drop column if exists most_useful_features;
alter table public.feedback drop column if exists disappearance_score;

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_type text not null,
  sent_at timestamptz not null default now(),
  opened boolean not null default false,
  completed boolean not null default false,
  response_answer text,
  response_note text
);

create index if not exists email_campaigns_user_id_idx
  on public.email_campaigns(user_id);

create index if not exists email_campaigns_type_sent_idx
  on public.email_campaigns(campaign_type, sent_at desc);

create unique index if not exists email_campaigns_user_type_unique_idx
  on public.email_campaigns(user_id, campaign_type);

alter table public.email_campaigns enable row level security;

drop policy if exists "Users read own email campaigns" on public.email_campaigns;
create policy "Users read own email campaigns"
  on public.email_campaigns for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users update own email campaigns" on public.email_campaigns;
create policy "Users update own email campaigns"
  on public.email_campaigns for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read email campaigns" on public.email_campaigns;
create policy "Admins read email campaigns"
  on public.email_campaigns for select
  to authenticated
  using (public.is_finpilot_admin());
