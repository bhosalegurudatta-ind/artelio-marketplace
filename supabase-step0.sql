-- =====================================================================
-- STEP 0: Supabase Production Schema & Security Hardening
-- Run once in Supabase -> SQL Editor. Safe to run multiple times.
-- =====================================================================

-- Security: users may edit only their own profile fields, never role, approval or access.
revoke update on users from authenticated, anon;
grant update (name, bio, address, shop_name, banner_url, about, shipping_policy, return_policy) on users to authenticated;

-- Security: orders can be created only by the server after a verified payment.
drop policy if exists "Customers create their own orders" on orders;

-- Roles and artist fields
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('artist', 'customer', 'admin'));
alter table users add column if not exists verified boolean not null default false;
alter table users add column if not exists shop_name text;
alter table users add column if not exists banner_url text;
alter table users add column if not exists about text;
alter table users add column if not exists shipping_policy text;
alter table users add column if not exists return_policy text;
alter table users add column if not exists subscription_id text;
alter table users add column if not exists subscription_status text;
alter table users add column if not exists linked_account_id text;
alter table users add column if not exists kyc_status text not null default 'not_started';

-- Artwork fields
alter table artworks add column if not exists is_hidden boolean not null default false;
alter table artworks add column if not exists takedown_reason text;
alter table artworks add column if not exists shipping_fee numeric not null default 0;
alter table artworks add column if not exists ships_from text;

-- Order and payout fields
alter table orders add column if not exists shipping_address text;
alter table orders add column if not exists shipping_fee numeric not null default 0;
alter table orders add column if not exists estimated_delivery date;
alter table orders add column if not exists awb_number text;
alter table orders add column if not exists courier text;
alter table orders add column if not exists tracking_status text;
alter table orders add column if not exists label_url text;
alter table payouts add column if not exists transfer_id text;
alter table payouts add column if not exists transfer_status text;
alter table payouts add column if not exists transfer_error text;

-- New tables
create table if not exists artwork_images (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  preview_url text not null, original_path text, fingerprint text,
  position int not null default 0, created_at timestamptz default now());

create table if not exists artwork_tags (
  artwork_id uuid not null references artworks(id) on delete cascade,
  tag text not null, primary key (artwork_id, tag));
create index if not exists artwork_tags_tag_idx on artwork_tags(tag);

create table if not exists favourites (
  user_id uuid references users(id) on delete cascade,
  artwork_id uuid references artworks(id) on delete cascade,
  created_at timestamptz default now(), primary key (user_id, artwork_id));

create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  artist_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(), primary key (follower_id, artist_id));

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade,
  buyer_id uuid references users(id) on delete cascade,
  artist_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(), unique (artwork_id, buyer_id));

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now(), read_at timestamptz);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade,
  artist_id uuid references users(id) on delete cascade,
  budget numeric not null, spent numeric not null default 0,
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'active', created_at timestamptz default now());

create table if not exists fusion_usage (
  user_id uuid references users(id) on delete cascade,
  month text not null, count int not null default 0,
  primary key (user_id, month));

-- Row Level Security for the new tables
alter table artwork_images enable row level security;
alter table artwork_tags enable row level security;
alter table favourites enable row level security;
alter table follows enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table promotions enable row level security;
alter table fusion_usage enable row level security;

drop policy if exists "Images are public" on artwork_images;
create policy "Images are public" on artwork_images for select using (true);

drop policy if exists "Tags are public" on artwork_tags;
create policy "Tags are public" on artwork_tags for select using (true);

drop policy if exists "Own favourites" on favourites;
create policy "Own favourites" on favourites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Own follows" on follows;
create policy "Own follows" on follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "Participants read conversations" on conversations;
create policy "Participants read conversations" on conversations for select using (auth.uid() in (buyer_id, artist_id));

drop policy if exists "Participants read messages" on messages;
create policy "Participants read messages" on messages for select using (
  exists (select 1 from conversations c where c.id = messages.conversation_id and auth.uid() in (c.buyer_id, c.artist_id)));

drop policy if exists "Artists read own promotions" on promotions;
create policy "Artists read own promotions" on promotions for select using (auth.uid() = artist_id);
-- fusion_usage has no policies: only the server can read or write it.
