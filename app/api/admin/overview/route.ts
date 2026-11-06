import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    // 1. Total users
    const { count: totalUsers, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (usersErr) throw usersErr;

    // 2. Artists
    const { count: totalArtists, error: artistsErr } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'artist');
    if (artistsErr) throw artistsErr;

    // 3. Approved artists
    const { count: approvedArtists, error: appErr } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'artist')
      .eq('approved', true);
    if (appErr) throw appErr;

    // 4. Orders
    const { count: totalOrders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });
    if (ordersErr) throw ordersErr;

    // 5. Commission total (sum of payouts.commission_amount)
    const { data: payouts, error: payoutsErr } = await supabaseAdmin
      .from('payouts')
      .select('commission_amount');
    if (payoutsErr) throw payoutsErr;

    const commissionTotal = (payouts ?? []).reduce(
      (sum, p) => sum + (Number(p.commission_amount) || 0),
      0
    );

    // 6. Open reports
    let openReports = 0;
    try {
      const { count: repCount } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      openReports = repCount ?? 0;
    } catch {
      openReports = 0;
    }

    return NextResponse.json({
      success: true,
      user: auth.user,
      stats: {
        totalUsers: totalUsers ?? 0,
        totalArtists: totalArtists ?? 0,
        approvedArtists: approvedArtists ?? 0,
        totalOrders: totalOrders ?? 0,
        commissionTotal: Math.round(commissionTotal * 100) / 100,
        openReports,
      },
    });
  } catch (err: any) {
    console.error('Admin overview API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
