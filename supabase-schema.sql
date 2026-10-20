-- Run this in Supabase's SQL Editor to set up your core tables.

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('artist', 'customer')),
  bio text,
  address text,
  created_at timestamp with time zone default now()
);

create table artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  medium text,
  price numeric not null,
  image_url text,
  created_at timestamp with time zone default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id),
  customer_id uuid references users(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  created_at timestamp with time zone default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  artist_id uuid references users(id),
  sale_amount numeric not null,
  commission_amount numeric not null,
  payout_amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamp with time zone default now()
);

-- Row Level Security: turn it on, then let people see what they should.
alter table users enable row level security;
alter table artworks enable row level security;
alter table orders enable row level security;

-- Anyone can view artist profiles and artwork listings (it's a public marketplace).
create policy "Public profiles are viewable" on users for select using (true);
create policy "Public artworks are viewable" on artworks for select using (true);

-- People can only edit their own profile.
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Only the artist who owns an artwork can insert/update/delete it.
create policy "Artists manage their own artworks" on artworks for insert with check (auth.uid() = artist_id);
create policy "Artists update their own artworks" on artworks for update using (auth.uid() = artist_id);
create policy "Artists delete their own artworks" on artworks for delete using (auth.uid() = artist_id);

-- Customers can see their own orders; artists can see orders on their artworks.
create policy "Customers view their own orders" on orders for select using (auth.uid() = customer_id);
create policy "Customers create their own orders" on orders for insert with check (auth.uid() = customer_id);

alter table payouts enable row level security;

-- Artists can see their own payout records; nothing is written to this table
-- directly from the browser — only the server-side payment verification route
-- (using the service role key) inserts rows here.
create policy "Artists view their own payouts" on payouts for select using (auth.uid() = artist_id);

-- ---------------------------------------------------------------------
-- STORAGE: run this part separately, or set it up via the dashboard UI
-- (Storage -> New Bucket -> name it "artworks" -> toggle "Public bucket" ON)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('artworks', 'artworks', true)
on conflict (id) do nothing;

create policy "Anyone can view artwork images" on storage.objects
  for select using (bucket_id = 'artworks');

create policy "Logged-in users can upload artwork images" on storage.objects
  for insert with check (bucket_id = 'artworks' and auth.role() = 'authenticated');
