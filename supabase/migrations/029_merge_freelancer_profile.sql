-- Объединить self_employed и freelancer в один профиль

update public.user_profiles
set profile_type = 'freelancer'
where profile_type = 'self_employed';

alter table public.user_profiles
drop constraint if exists user_profiles_profile_type_check;

alter table public.user_profiles
add constraint user_profiles_profile_type_check
check (
  profile_type in (
    'employee',
    'freelancer',
    'business_owner',
    'retiree'
  )
);
