-- Опрос ценности продукта после реального использования

alter table public.feedback
  add column if not exists value_feedback_answer text
    check (value_feedback_answer in ('yes', 'partial', 'no')),
  add column if not exists value_feedback_detail text,
  add column if not exists value_feedback_at timestamptz;

create index if not exists feedback_value_feedback_at_idx
  on public.feedback(value_feedback_at desc)
  where value_feedback_at is not null;
