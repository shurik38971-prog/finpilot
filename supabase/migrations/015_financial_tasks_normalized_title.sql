alter table public.financial_tasks
add column if not exists normalized_title text;

create index if not exists financial_tasks_normalized_title_idx
on public.financial_tasks(user_id, normalized_title);

-- Backfill for existing rows (approximates normalizeTaskTitle in app)
update public.financial_tasks
set normalized_title = trim(
  regexp_replace(
    lower(
      regexp_replace(coalesce(title, ''), '[^a-zA-Zа-яА-ЯёЁ0-9\s]', '', 'g')
    ),
    '\s+',
    ' ',
    'g'
  )
)
where normalized_title is null
  and coalesce(title, '') <> '';
