-- Run this ONCE in Supabase -> SQL Editor to add shipping & courier tracking columns to the orders table.
-- Safe to run multiple times.

alter table orders add column if not exists shipping_name text;
alter table orders add column if not exists shipping_phone text;
alter table orders add column if not exists shipping_address text;
alter table orders add column if not exists shipping_city text;
alter table orders add column if not exists shipping_state text;
alter table orders add column if not exists shipping_postal_code text;
alter table orders add column if not exists courier_name text;
alter table orders add column if not exists tracking_url text;

-- Allow buyers to see their own orders with shipping details, and artists to see shipping details for orders of their artworks
drop policy if exists "Artists can view orders for their artworks" on orders;
create policy "Artists can view orders for their artworks" on orders
  for select using (
    exists (
      select 1 from artworks
      where artworks.id = orders.artwork_id
      and artworks.artist_id = auth.uid()
    )
  );
