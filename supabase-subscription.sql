-- Run in Supabase SQL Editor to support Razorpay Subscriptions
-- 1. Add subscription_id and subscription_status to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text default 'trial';

-- 2. Index for fast webhook lookups by subscription_id
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users (subscription_id);
