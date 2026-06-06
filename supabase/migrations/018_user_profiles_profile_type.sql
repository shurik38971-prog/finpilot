alter table public.user_profiles
add column if not exists profile_type text
check (profile_type in ('employee', 'freelancer', 'business_owner', 'retiree'));

create index if not exists user_profiles_profile_type_idx
on public.user_profiles(profile_type);

update public.user_profiles
set profile_type = 'freelancer'
where profile_type is null;

alter table public.onboarding_progress
add column if not exists profile_done boolean not null default false;

update public.onboarding_progress
set profile_done = true
where profile_done = false;
