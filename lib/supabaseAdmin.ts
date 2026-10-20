import { createClient } from '@supabase/supabase-js';

// SERVER ONLY. This client uses the service role key, which bypasses every security
// rule in the database. Import it only from files under app/api/, never from a page or component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Works out who is calling an API route from the access token the browser sends.
export async function getUserFromRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
