-- Run in Supabase SQL Editor to support Razorpay Route Automatic Bank Payouts
-- 1. Add linked_account_id and kyc_status to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_account_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status text default 'created';

-- 2. Add transfer_id, transfer_status, and transfer_error to payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transfer_id text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transfer_status text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS transfer_error text;

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_linked_account_id ON users (linked_account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_transfer_id ON payouts (transfer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_transfer_status ON payouts (transfer_status);
