-- User-facing debt context for priority calculation

alter table public.debts
  add column if not exists is_overdue boolean not null default false;

alter table public.debts
  add column if not exists notes text;
