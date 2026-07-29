-- Blocks table for friending system
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_id <> blocked_id),
  constraint blocks_unique_pair unique (blocker_id, blocked_id)
);

-- Indexes for performance
create index if not exists blocks_blocker_idx on public.blocks(blocker_id);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);

-- Enable RLS
alter table public.blocks enable row level security;

-- Policy: Users can only manage their own blocks
drop policy if exists "Users can view their own blocks" on public.blocks;
create policy "Users can view their own blocks"
on public.blocks
for select
to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "Users can create blocks" on public.blocks;
create policy "Users can create blocks"
on public.blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "Users can delete their blocks" on public.blocks;
create policy "Users can delete their blocks"
on public.blocks
for delete
to authenticated
using (auth.uid() = blocker_id);
