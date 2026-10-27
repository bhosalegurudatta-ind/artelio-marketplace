import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { PHYSICAL_RELEASE_DAYS, DAY } from '@/lib/mvp';
import { sendDispatchEmail } from '@/lib/mailer';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const orderId = params.id;
    if (!orderId) return fail('Order ID required.', 400);

    const body = await req.json().catch(() => ({}));
    const { trackingNote, courierName, trackingUrl } = body;

    // Verify order exists and belongs to artwork created by this artist
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, artwork_id, customer_id, shipping_name, artworks(title, artist_id, is_digital)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return fail('Order not found.', 404);

    const artwork: any = order.artworks;
    if (!artwork || artwork.artist_id !== user.id) {
      return fail('You can only mark orders for your own artworks as shipped.', 403);
    }

    if (artwork.is_digital) {
      return fail('Digital artworks are delivered instantly and do not require physical shipping.', 400);
    }

    if (order.status !== 'paid') {
      return fail(`Cannot mark order as shipped because status is "${order.status}".`, 400);
    }

    const now = Date.now();
    const releaseAt = new Date(now + PHYSICAL_RELEASE_DAYS * DAY).toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        shipped_at: new Date(now).toISOString(),
        tracking_note: trackingNote?.trim() || null,
        courier_name: courierName?.trim() || null,
        tracking_url: trackingUrl?.trim() || null,
        release_at: releaseAt,
      })
      .eq('id', orderId);

    if (updateErr) {
      console.error('Ship order error:', updateErr);
      return fail('Could not update order status.', 500);
    }

    // Trigger customer dispatch notification with live tracking info asynchronously
    try {
      const { data: customerUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', order.customer_id)
        .maybeSingle();

      sendDispatchEmail({
        orderId,
        artworkTitle: artwork.title || 'Original Artwork',
        buyerName: order.shipping_name || 'Art Collector',
        buyerEmail: customerUser?.email,
        courierName: courierName?.trim(),
        trackingNumber: trackingNote?.trim(),
        trackingUrl: trackingUrl?.trim(),
      }).catch((emailErr) => console.error('[Ship] Dispatch email error:', emailErr));
    } catch (e) {
      console.error('[Ship] Could not prepare dispatch email data:', e);
    }

    return NextResponse.json({ success: true, releaseAt });
  } catch (err) {
    console.error('Ship route error:', err);
    return fail('Internal server error.', 500);
  }
}
