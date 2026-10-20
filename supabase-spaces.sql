-- =====================================================================
-- ARTELIO: COLLECTOR SPACES & SAVED ARTWORKS
-- Run this in Supabase SQL Editor to enable saving room mockups & favorites.
-- =====================================================================

create table if not exists public.room_mockups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  artwork_id uuid references public.artworks(id) on delete set null,
  image_url text not null,
  title text not null default 'My Styled Space',
  room_style text,
  harmony_score int,
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, artwork_id)
);

alter table public.room_mockups enable row level security;
alter table public.favorites enable row level security;

-- Mockup Policies
drop policy if exists "Public mockups are viewable" on public.room_mockups;
create policy "Public mockups are viewable" on public.room_mockups
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "Users manage their own mockups" on public.room_mockups;
create policy "Users manage their own mockups" on public.room_mockups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Favorites Policies
drop policy if exists "Users manage their own favorites" on public.favorites;
create policy "Users manage their own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
