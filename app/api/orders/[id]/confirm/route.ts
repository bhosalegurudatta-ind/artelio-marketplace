import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

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

    // 2. Immediately release held payout to the artist
    const { error: payoutErr } = await supabaseAdmin
      .from('payouts')
      .update({
        status: 'released',
        released_at: nowIso,
      })
      .eq('order_id', orderId);

    if (payoutErr) {
      console.error('Release payout error:', payoutErr);
      // Payout update error is logged, order is still marked delivered
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Confirm route error:', err);
    return fail('Internal server error.', 500);
  }
}
