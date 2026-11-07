import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { sendPayoutReleasedArtistEmail } from '@/lib/email';
import { executePayoutTransfer } from '@/lib/payoutTransfer';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const orderId = params.id;
    if (!orderId) return fail('Order ID required.', 400);

    // Verify order belongs to this customer
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return fail('Order not found.', 404);

    if (order.customer_id !== user.id) {
      return fail('You can only confirm receipt for your own orders.', 403);
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ success: true, message: 'Already confirmed as delivered.' });
    }

    if (!['paid', 'shipped'].includes(order.status)) {
      return fail(`Cannot confirm receipt for an order with status "${order.status}".`, 400);
    }

    const nowIso = new Date().toISOString();

    // 1. Mark order as delivered and clear release countdown
    const { error: updateOrderErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: nowIso,
        release_at: null,
      })
      .eq('id', orderId);

    if (updateOrderErr) {
      console.error('Confirm order update error:', updateOrderErr);
      return fail('Could not update order status.', 500);
    }

    // 2. Release step: Immediately release held payout to the artist
    const { data: releasedPayout, error: payoutErr } = await supabaseAdmin
      .from('payouts')
      .update({
        status: 'released',
        released_at: nowIso,
      })
      .eq('order_id', orderId)
      .select('id')
      .maybeSingle();

    if (payoutErr) {
      console.error('Release payout error:', payoutErr);
      // Payout update error is logged, order is still marked delivered
    }

    // 3. Transfer step (kept strictly separate from release):
    // Create a transfer of payout_amount in paise to the artist's linked account
    if (releasedPayout?.id) {
      try {
        await executePayoutTransfer(releasedPayout.id);
      } catch (trfErr) {
        console.error('Payout transfer execution error:', trfErr);
      }
    }

    // 3. Notify artist that payout is released
    try {
      const { data: payout } = await supabaseAdmin
        .from('payouts')
        .select('payout_amount, artist_id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (payout?.artist_id) {
        const { data: artistUser } = await supabaseAdmin
          .from('users')
          .select('name, email')
          .eq('id', payout.artist_id)
          .maybeSingle();

        const { data: orderDetails } = await supabaseAdmin
          .from('orders')
          .select('artworks(title)')
          .eq('id', orderId)
          .maybeSingle();

        if (artistUser?.email) {
          sendPayoutReleasedArtistEmail({
            to: artistUser.email,
            artistName: artistUser.name,
            orderId,
            artworkTitle: (orderDetails?.artworks as any)?.title || null,
            amount: Number(payout.payout_amount) || 0,
          }).catch((err) => console.error('[Confirm] Payout email send error:', err));
        }
      }
    } catch (e) {
      console.error('[Confirm] Failed preparing payout notification:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Confirm route error:', err);
    return fail('Internal server error.', 500);
  }
}
