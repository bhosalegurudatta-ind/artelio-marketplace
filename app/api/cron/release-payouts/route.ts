import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { executePayoutTransfer } from '@/lib/payoutTransfer';

// Releases held payouts whose release date has passed with no dispute.
// Call it once a day with the header:  Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set.' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabaseAdmin
    .from('payouts')
    .select('id, order_id, orders!inner(status, release_at)')
    .eq('status', 'held')
    .lte('orders.release_at', nowIso)
    .in('orders.status', ['paid', 'shipped']);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: any[] = due ?? [];
  if (rows.length === 0) return NextResponse.json({ released: 0 });

  const payoutIds = rows.map((r) => r.id);
  const orderIds = rows.map((r) => r.order_id);

  // 1. Release step (kept strictly separate): mark as released
  await supabaseAdmin.from('payouts').update({ status: 'released', released_at: nowIso }).in('id', payoutIds);
  await supabaseAdmin.from('orders').update({ status: 'delivered', delivered_at: nowIso, release_at: null }).in('id', orderIds);

  // 2. Transfer step: create a transfer of payout_amount in paise to the artist's linked account
  const transfers: any[] = [];
  for (const pid of payoutIds) {
    try {
      const trfRes = await executePayoutTransfer(pid);
      transfers.push({ payoutId: pid, ...trfRes });
    } catch (trfErr: any) {
      console.error(`Cron payout transfer execution error for ${pid}:`, trfErr);
      transfers.push({ payoutId: pid, success: false, error: trfErr?.message });
    }
  }

  return NextResponse.json({
    released: payoutIds.length,
    transfers,
  });
}
