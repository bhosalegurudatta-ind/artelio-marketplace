import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is safe to use in the browser — it only ever holds the public
// anon key. Row Level Security policies in Supabase are what actually keep
// data safe, not this key being secret.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
