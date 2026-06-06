alter table public.financial_tasks
  add column if not exists explanation text;

comment on column public.financial_tasks.explanation is
  'Фактическое основание рекомендации из данных пользователя (например: «Подушка = 0 ₽»).';
