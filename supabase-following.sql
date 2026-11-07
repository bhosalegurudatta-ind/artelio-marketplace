-- ==============================================================================
-- ARTELIO: FOLLOWING & NEW ARTWORK NOTIFICATIONS MIGRATION
-- ==============================================================================

create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  artist_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, artist_id)
);

alter table follows enable row level security;

-- Public can read follows (for follower counts and checking follows)
drop policy if exists "Public read follows" on follows;
create policy "Public read follows" on follows for select using (true);

-- Authenticated users can manage their own follows
drop policy if exists "Own follows" on follows;
create policy "Own follows" on follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Track follower email dispatch per artwork so followers are emailed once per artwork
alter table artworks add column if not exists followers_notified boolean not null default false;

-- Indexes for lightning fast feed and notification lookups
create index if not exists artworks_artist_created_idx on artworks(artist_id, created_at desc);
create index if not exists follows_follower_idx on follows(follower_id);
create index if not exists follows_artist_idx on follows(artist_id);
