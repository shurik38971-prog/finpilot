-- Единственный владелец админки (email из GitHub-аккаунта проекта)
delete from public.admin_users;

insert into public.admin_users (email)
values ('shurik38971@gmail.com')
on conflict (email) do nothing;
