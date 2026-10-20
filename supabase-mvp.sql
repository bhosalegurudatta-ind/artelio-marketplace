-- Run ONCE in Supabase -> SQL Editor, AFTER supabase-schema.sql and supabase-update.sql.
-- Safe to run twice.

-- 1. Artist approval and free trial (founders approve artists manually)
alter table users add column if not exists approved boolean not null default true;   -- existing accounts stay approved
alter table users alter column approved set default false;                            -- new signups wait for approval
alter table users add column if not exists trial_ends_at timestamptz;
alter table users add column if not exists paid_until timestamptz;
update users set trial_ends_at = now() + interval '30 days'
where role = 'artist' and trial_ends_at is null;

-- 2. Original / AI-assisted label on every artwork
alter table artworks add column if not exists is_ai_assisted boolean not null default false;

-- 3. Order lifecycle: paid -> shipped -> delivered, or disputed
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;
alter table orders add column if not exists release_at timestamptz;     -- when the payout is released automatically
alter table orders add column if not exists tracking_note text;
alter table orders add column if not exists dispute_reason text;
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'disputed'));

-- 4. Payouts are HELD until delivery is confirmed, then RELEASED
alter table payouts add column if not exists released_at timestamptz;
alter table payouts drop constraint if exists payouts_status_check;
update payouts set status = 'held' where status = 'pending';
alter table payouts alter column status set default 'held';
alter table payouts add constraint payouts_status_check
  check (status in ('held', 'released', 'disputed'));

-- 5. Report-and-takedown. Only the server can read or write this table.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid references artworks(id) on delete cascade,
  reporter_id uuid references users(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz default now()
);
alter table reports enable row level security;
