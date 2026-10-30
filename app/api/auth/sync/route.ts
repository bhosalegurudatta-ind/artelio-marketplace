import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedRole = body?.role;

    // Check if the user already has a row in public.users
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, bio, address')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Auth Sync] Error fetching profile:', fetchError);
    }

    if (!profile) {
      // Profile is missing: synthesize metadata from OAuth or signup
      const meta = user.user_metadata || {};
      const name =
        meta.name ||
        meta.full_name ||
        (user.email ? user.email.split('@')[0] : 'Collector');

      const role = requestedRole === 'artist' || meta.role === 'artist' ? 'artist' : 'customer';

      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            id: user.id,
            name,
            email: user.email || '',
            role,
            bio: meta.bio || null,
            address: meta.address || null,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (insertError) {
        console.error('[Auth Sync] Failed to create user profile:', insertError);
        return NextResponse.json({ error: 'Could not create user profile' }, { status: 500 });
      }

      return NextResponse.json({ profile: newProfile });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('[Auth Sync] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
