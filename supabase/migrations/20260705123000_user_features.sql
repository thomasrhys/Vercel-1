create table if not exists public.user_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, game_id)
);

alter table public.user_favourites enable row level security;

drop policy if exists user_favourites_select_own on public.user_favourites;
drop policy if exists user_favourites_insert_own on public.user_favourites;
drop policy if exists user_favourites_delete_own on public.user_favourites;

create policy user_favourites_select_own on public.user_favourites for select to authenticated using (auth.uid() = user_id);
create policy user_favourites_insert_own on public.user_favourites for insert to authenticated with check (auth.uid() = user_id);
create policy user_favourites_delete_own on public.user_favourites for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.game_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  url text,
  notes text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_requests enable row level security;

drop policy if exists game_requests_select_all on public.game_requests;
drop policy if exists game_requests_insert_auth on public.game_requests;
drop policy if exists game_requests_update_own on public.game_requests;

create policy game_requests_select_all on public.game_requests for select to authenticated using (true);
create policy game_requests_insert_auth on public.game_requests for insert to authenticated with check (auth.uid() = user_id);
create policy game_requests_update_own on public.game_requests for update to authenticated using (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;

create policy notifications_select_own on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy notifications_update_own on public.notifications for update to authenticated using (auth.uid() = user_id);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  title text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

alter table public.user_achievements enable row level security;

drop policy if exists achievements_select_own on public.user_achievements;
create policy achievements_select_own on public.user_achievements for select to authenticated using (auth.uid() = user_id);
