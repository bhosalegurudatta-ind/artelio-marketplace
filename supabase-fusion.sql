-- ==============================================================================
-- ARTELIO MARKETPLACE • AI STYLE-FUSION TOOL SCHEMA
-- Run in Supabase -> SQL Editor. Safe to run multiple times.
-- ==============================================================================

create table if not exists fusion_usage (
  user_id uuid references users(id) on delete cascade,
  month text not null,
  count int not null default 0,
  primary key (user_id, month)
);

-- Row Level Security
alter table fusion_usage enable row level security;
-- No client policies: only server-side service role (supabaseAdmin) can read/write fusion_usage
