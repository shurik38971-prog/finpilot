alter table public.user_profiles
drop constraint if exists user_profiles_profile_type_check;

alter table public.user_profiles
add constraint user_profiles_profile_type_check
check (
  profile_type in (
    'employee',
    'self_employed',
    'freelancer',
    'business_owner',
    'retiree'
  )
);
