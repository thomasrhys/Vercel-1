alter table public.user_profiles add column if not exists username text;
alter table public.user_profiles add column if not exists role text not null default 'user';
alter table public.user_profiles add column if not exists bio text;

create unique index if not exists user_profiles_username_unique
on public.user_profiles (lower(username))
where username is not null;

create table if not exists public.reserved_usernames (
  username text primary key,
  allowed_email text
);

insert into public.reserved_usernames (username, allowed_email) values
  ('owner', 'thomasrhyshughes29@gmail.com'),
  ('pitstopyt', 'thomasrhyshughes29@gmail.com'),
  ('admin', null),
  ('administrator', null),
  ('support', null),
  ('staff', null),
  ('system', null),
  ('gamesportal', null),
  ('fnfaw', null),
  ('moderator', null),
  ('official', null),
  ('api', null),
  ('root', null)
on conflict (username) do update set allowed_email = excluded.allowed_email;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
