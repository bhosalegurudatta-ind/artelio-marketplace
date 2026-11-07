-- ==============================================================================
-- ARTELIO MARKETPLACE • PROMOTED LISTINGS SCHEMA
-- Safe to run multiple times in Supabase -> SQL Editor
-- ==============================================================================

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade,
  artist_id uuid references users(id) on delete cascade,
  budget numeric not null,
  spent numeric not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active',
  days integer,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz default now()
);

alter table promotions add column if not exists days integer;
alter table promotions add column if not exists razorpay_order_id text;
alter table promotions add column if not exists razorpay_payment_id text;

-- Indexes for performance
create index if not exists idx_promotions_artwork_id on promotions(artwork_id);
create index if not exists idx_promotions_artist_id on promotions(artist_id);
create index if not exists idx_promotions_status_ends_at on promotions(status, ends_at);

-- Row Level Security
alter table promotions enable row level security;

-- Artists can view their own promotions
drop policy if exists "Artists read own promotions" on promotions;
create policy "Artists read own promotions" on promotions
  for select using (auth.uid() = artist_id);

-- Public can view active promotions so Browse & Home page can feature them
drop policy if exists "Public read active promotions" on promotions;
create policy "Public read active promotions" on promotions
  for select using (status = 'active');
