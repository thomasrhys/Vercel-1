alter table public.user_profiles
  add column if not exists country text,
  add column if not exists website_url text,
  add column if not exists favourite_games text[] not null default '{}';
