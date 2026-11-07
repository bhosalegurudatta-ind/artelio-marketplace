-- ==============================================================================
-- ARTELIO MARKETPLACE • ARTIST VERIFICATION SCHEMA
-- Safe to run multiple times in Supabase -> SQL Editor
-- ==============================================================================

alter table users add column if not exists verified boolean not null default false;
create index if not exists idx_users_verified on users(verified);

-- Allow public read of verified status on users
-- (Users table already has select policy, but ensuring verified column is readable)
