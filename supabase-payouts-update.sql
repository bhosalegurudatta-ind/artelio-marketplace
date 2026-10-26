-- Run this ONCE in Supabase -> SQL Editor to add Artist Payout & Banking columns.
-- Safe to run multiple times.

-- 1. Payout destination columns on users table
alter table users add column if not exists payout_method text check (payout_method in ('upi', 'bank'));
alter table users add column if not exists payout_upi_id text;
alter table users add column if not exists payout_account_holder text;
alter table users add column if not exists payout_account_number text;
alter table users add column if not exists payout_ifsc text;
alter table users add column if not exists payout_bank_name text;

-- 2. Settlement tracking on payouts table
alter table payouts add column if not exists transfer_reference text;
alter table payouts add column if not exists transferred_at timestamptz;

-- 3. Security: ensure users can only update their own payout settings
-- (Handled by existing policy: "Users can update own profile" on users for update using (auth.uid() = id))
