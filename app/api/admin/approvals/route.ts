import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { TRIAL_DAYS, DAY } from '@/lib/mvp';
import { sendApplicationApprovedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/approvals: lists artists with approved = false
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data: artists, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, approved, bio, address, shop_name, created_at, trial_ends_at')
      .eq('role', 'artist')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      artists: artists ?? [],
    });
  } catch (err: any) {
    console.error('Admin approvals GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/approvals: approve artist -> approved = true & trial_ends_at = now + TRIAL_DAYS
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { artistId } = await req.json();
    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required.' }, { status: 400 });
    }

    const now = Date.now();
    const trialEndsAt = new Date(now + TRIAL_DAYS * DAY).toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        approved: true,
        trial_ends_at: trialEndsAt,
      })
      .eq('id', artistId)
      .eq('role', 'artist')
      .select('id, name, email, approved, trial_ends_at')
      .single();

    if (error) throw error;

    // Send application approved email to the artist
    if (updated?.email) {
      try {
        await sendApplicationApprovedEmail({
          to: updated.email,
          artistName: updated.name,
          trialDays: TRIAL_DAYS,
        });
      } catch (emailErr) {
        console.error('[Admin Approvals] Failed to send approval email to artist:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      artist: updated,
    });
  } catch (err: any) {
    console.error('Admin approvals POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
