import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, bio, address, phone, paid_until, payout_method, payout_upi_id, payout_account_holder, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Fetch profile error:', error);
      return fail('Could not load profile.', 500);
    }

    if (!profile) {
      // Auto-create initial profile
      const meta = user.user_metadata || {};
      const newProfile = {
        id: user.id,
        name: meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'Member'),
        email: user.email || '',
        role: meta.role === 'artist' ? 'artist' : 'customer',
        bio: meta.bio || null,
        address: meta.address || null,
      };
      await supabaseAdmin.from('users').upsert(newProfile);
      return NextResponse.json({ profile: newProfile });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return fail('Internal server error.', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const body = await req.json().catch(() => ({}));
    const { name, bio, address, phone, role } = body;

    const updates: Record<string, any> = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof bio === 'string') updates.bio = bio.trim();
    if (typeof address === 'string') updates.address = address.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (role && ['artist', 'customer'].includes(role)) updates.role = role;

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, name, email, role, bio, address, phone, paid_until, payout_method, payout_upi_id, payout_account_holder, created_at')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return fail('Could not update profile.', 500);
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    console.error('Update profile API error:', err);
    return fail('Internal server error.', 500);
  }
}
