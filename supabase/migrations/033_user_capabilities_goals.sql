alter table public.user_capabilities
  add column if not exists primary_goal text,
  add column if not exists secondary_goals text[] not null default '{}';

update public.user_capabilities
set primary_goal = case target_result
  when 'Закрыть долги' then 'Закрыть долги'
  when 'Накопить подушку' then 'Создать подушку безопасности'
  when 'Увеличить доход' then 'Увеличить доход'
  when 'Снизить расходы' then 'Снизить расходы'
  when 'Покрыть дефицит' then 'Улучшить финансовую стабильность'
  else primary_goal
end
where primary_goal is null and target_result is not null;
