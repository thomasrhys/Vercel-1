create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_unique
on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);
create index if not exists friendships_status_idx on public.friendships(status);

alter table public.friendships enable row level security;

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
on public.friendships
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can send friend requests" on public.friendships;
create policy "Users can send friend requests"
on public.friendships
for insert
to authenticated
with check (auth.uid() = requester_id and requester_id <> addressee_id and status = 'pending');

drop policy if exists "Users can update received friend requests" on public.friendships;
create policy "Users can update received friend requests"
on public.friendships
for update
to authenticated
using (auth.uid() = addressee_id or auth.uid() = requester_id)
with check (auth.uid() = addressee_id or auth.uid() = requester_id);

drop policy if exists "Users can delete their friendships" on public.friendships;
create policy "Users can delete their friendships"
on public.friendships
for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);
