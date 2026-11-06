import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { sendProblemReportedEmails } from '@/lib/email';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const orderId = params.id;
    if (!orderId) return fail('Order ID required.', 400);

    const body = await req.json().catch(() => ({}));
    const { reason } = body;
    if (!reason || !reason.trim()) return fail('Please provide a reason for the dispute.', 400);

    // Verify order belongs to this customer
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return fail('Order not found.', 404);

    if (order.customer_id !== user.id) {
      return fail('You can only report issues for your own orders.', 403);
    }

    if (order.status === 'disputed') {
      return NextResponse.json({ success: true, message: 'Dispute is already recorded.' });
    }

    // 1. Put order into disputed state and freeze automatic payout release
    const { error: updateOrderErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'disputed',
        dispute_reason: reason.trim(),
        release_at: null,
      })
      .eq('id', orderId);

    if (updateOrderErr) {
      console.error('Dispute order update error:', updateOrderErr);
      return fail('Could not update order status.', 500);
    }

    // 2. Pause the held payout so cron does not release it
    const { error: payoutErr } = await supabaseAdmin
      .from('payouts')
      .update({ status: 'disputed' })
      .eq('order_id', orderId);

    if (payoutErr) {
      console.error('Dispute payout pause error:', payoutErr);
    }

    // 3. Notify buyer and admin about the reported problem / dispute
    try {
      const { data: orderDetails } = await supabaseAdmin
        .from('orders')
        .select('shipping_name, artworks(title)')
        .eq('id', orderId)
        .maybeSingle();

      const buyerEmail = user.email;
      if (buyerEmail) {
        sendProblemReportedEmails({
          buyerEmail,
          buyerName: orderDetails?.shipping_name || user.user_metadata?.name || 'Collector',
          orderId,
          artworkTitle: (orderDetails?.artworks as any)?.title || null,
          reason: reason.trim(),
        }).catch((err) => console.error('[Dispute] Problem reported email error:', err));
      }
    } catch (e) {
      console.error('[Dispute] Failed preparing problem reported emails:', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Dispute route error:', err);
    return fail('Internal server error.', 500);
  }
}
