-- Быстрый опрос после 3-го входа (рейтинг 1–5 + свободный текст)

alter table public.feedback
  add column if not exists rating_score integer check (rating_score between 1 and 5),
  add column if not exists quick_useful_text text,
  add column if not exists quick_feedback_at timestamptz;

create index if not exists feedback_rating_score_idx
  on public.feedback(rating_score)
  where rating_score is not null;
