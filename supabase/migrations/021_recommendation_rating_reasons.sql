-- Причины низкой оценки рекомендаций

alter table public.task_recommendation_ratings
  add column if not exists task_title text,
  add column if not exists low_rating_reason text
    check (
      low_rating_reason is null
      or low_rating_reason in (
        'unrealistic',
        'not_suitable',
        'already_done',
        'unclear'
      )
    );

drop policy if exists "Admins read financial goals" on public.financial_goals;
create policy "Admins read financial goals"
  on public.financial_goals for select
  to authenticated
  using (public.is_finpilot_admin());
