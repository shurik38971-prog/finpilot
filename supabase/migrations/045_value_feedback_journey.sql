-- Привязка опроса ценности к циклу анализа и отдельный cooldown для «Позже»

alter table public.feedback
  add column if not exists value_feedback_dismissed_at timestamptz,
  add column if not exists value_feedback_analysis_id uuid references public.analyses(id) on delete set null,
  add column if not exists value_feedback_survey_version int;

create index if not exists feedback_value_feedback_dismissed_at_idx
  on public.feedback(value_feedback_dismissed_at desc)
  where value_feedback_dismissed_at is not null;
