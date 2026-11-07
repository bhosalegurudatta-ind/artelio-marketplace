-- ==============================================================================
-- ARTELIO MARKETPLACE • SHIPPING LABELS & COURIER TRACKING SCHEMA
-- Run this in Supabase -> SQL Editor. Safe to run multiple times.
-- ==============================================================================

alter table orders add column if not exists awb_number text;
alter table orders add column if not exists courier text;
alter table orders add column if not exists label_url text;
alter table orders add column if not exists tracking_status text default 'label_created';

-- Optional index to speed up courier webhook lookups by AWB
create index if not exists idx_orders_awb_number on orders(awb_number);
