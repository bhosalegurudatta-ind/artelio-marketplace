import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// Daily cron job to end promotions whose duration has expired.
// Invoked with: Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 500 });
    }

    if (req.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // 1. Find active promotions whose end date has passed
    const { data: expiredPromos, error: fetchErr } = await supabaseAdmin
      .from('promotions')
      .select('id, artwork_id, artist_id, ends_at, budget, spent')
      .eq('status', 'active')
      .lte('ends_at', nowIso);

    if (fetchErr) {
      console.error('Error querying expired promotions:', fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const idsToEnd: string[] = (expiredPromos || []).map((p: any) => p.id);

    // Also find any active promotions where budget is fully spent (if any)
    const { data: spentPromos } = await supabaseAdmin
      .from('promotions')
      .select('id, budget, spent')
      .eq('status', 'active');

    if (spentPromos) {
      for (const p of spentPromos) {
        if (p.budget > 0 && p.spent >= p.budget && !idsToEnd.includes(p.id)) {
          idsToEnd.push(p.id);
        }
      }
    }

    if (idsToEnd.length === 0) {
      return NextResponse.json({ success: true, expired: 0, message: 'No promotions expired.' });
    }

    // 2. Mark promotions as ended
    const { error: updateErr } = await supabaseAdmin
      .from('promotions')
      .update({ status: 'ended' })
      .in('id', idsToEnd);

    if (updateErr) {
      console.error('Error updating expired promotions:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expired: idsToEnd.length,
      endedIds: idsToEnd,
    });
  } catch (err: any) {
    console.error('Expire promotions cron error:', err);
    return NextResponse.json({ error: 'Internal server error in cron job.' }, { status: 500 });
  }
}
