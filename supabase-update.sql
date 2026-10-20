-- Run this ONCE in Supabase -> SQL Editor, BEFORE using the new code.
-- It is safe to run twice.

-- 1. New columns
alter table artworks add column if not exists original_path text;                  -- private original (digital art only)
alter table artworks add column if not exists image_hash text;                      -- fingerprint used by the duplicate check
alter table artworks add column if not exists is_digital boolean not null default false;
alter table artworks add column if not exists sold boolean not null default false;  -- one-off originals can only sell once
alter table orders   add column if not exists razorpay_payment_id text unique;      -- stops the same payment being recorded twice

-- 2. Private bucket for original, full-resolution files. No public policy on purpose:
--    only the server (service role) can read it, and it hands out short-lived links after a paid order.
insert into storage.buckets (id, name, public) values ('originals', 'originals', false)
on conflict (id) do nothing;

-- 3. Lock down direct writes. Artwork is now created only by the server route, which
--    checks the image, adds the watermark and runs the duplicate check.
drop policy if exists "Logged-in users can upload artwork images" on storage.objects;
drop policy if exists "Artists manage their own artworks" on artworks;   -- the INSERT policy
drop policy if exists "Artists update their own artworks" on artworks;   -- no edit feature yet; server-side later
-- (The DELETE policy stays, so artists can still remove their own listings.)

-- 4. Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  artist_id uuid not null references users(id) on delete cascade,
  reviewer_id uuid not null references users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
alter table reviews enable row level security;

drop policy if exists "Reviews are public" on reviews;
create policy "Reviews are public" on reviews for select using (true);

drop policy if exists "Buyers review their own paid orders" on reviews;
create policy "Buyers review their own paid orders" on reviews for insert with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from orders o join artworks a on a.id = o.artwork_id
    where o.id = reviews.order_id
      and o.customer_id = auth.uid()
      and o.status in ('paid', 'shipped', 'delivered')
      and a.artist_id = reviews.artist_id
  )
);

-- 5. Create the profile row automatically at signup. This keeps signup working
--    after you turn email confirmation back on (no browser session exists until the email is confirmed).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, role, bio, address)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'Unnamed'),
    new.email,
    case when new.raw_user_meta_data->>'role' = 'artist' then 'artist' else 'customer' end,
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'address'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
