create table if not exists public.site_copy (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create index if not exists site_copy_updated_at_idx
  on public.site_copy(updated_at desc);

alter table public.site_copy enable row level security;

drop policy if exists "Public read site copy" on public.site_copy;
create policy "Public read site copy"
  on public.site_copy for select
  to anon, authenticated
  using (true);
