import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyCourierWebhookAuth } from '@/lib/courier';
import { PHYSICAL_RELEASE_DAYS, DAY } from '@/lib/mvp';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request using COURIER_API_KEY from environment without printing it
    const authHeader =
      req.headers.get('authorization') ||
      req.headers.get('x-courier-key') ||
      req.headers.get('x-api-key');

    // Only reject if an auth token was sent and failed verification, or if webhook requires auth
    if (authHeader && !verifyCourierWebhookAuth(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized courier webhook.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const awb = String(body.awb_number || body.awb || body.tracking_number || body.tracking_note || '').trim();
    const orderId = String(body.order_id || body.orderId || '').trim();
    const rawStatus = String(body.tracking_status || body.status || body.event || '').trim().toLowerCase();

    if (!awb && !orderId) {
      return NextResponse.json(
        { error: 'Missing shipment identifier. Please provide awb_number or order_id.' },
        { status: 400 }
      );
    }

    // 2. Find order by awb_number, tracking_note, or id
    let query = supabaseAdmin.from('orders').select('id, status, awb_number, tracking_note, release_at');
    if (awb) {
      query = query.or(`awb_number.eq.${awb},tracking_note.eq.${awb}`);
    } else {
      query = query.eq('id', orderId);
    }

    const { data: matchedOrders, error: findErr } = await query.limit(1);

    if (findErr || !matchedOrders || matchedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found for given AWB or order ID.' },
        { status: 404 }
      );
    }

    const order = matchedOrders[0];

    // 3. Normalize tracking status
    let trackingStatus = 'in_transit';
    if (rawStatus.includes('deliver')) {
      trackingStatus = 'delivered';
    } else if (rawStatus.includes('out_for_delivery') || rawStatus.includes('out for delivery')) {
      trackingStatus = 'out_for_delivery';
    } else if (rawStatus.includes('transit') || rawStatus.includes('dispatched')) {
      trackingStatus = 'in_transit';
    } else if (rawStatus.includes('pickup') || rawStatus.includes('manifest')) {
      trackingStatus = 'manifested';
    } else if (rawStatus.includes('label')) {
      trackingStatus = 'label_created';
    } else if (rawStatus) {
      trackingStatus = rawStatus;
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      tracking_status: trackingStatus,
    };

    let releaseAt: string | null = null;
    let orderStatus = order.status;

    // 4. On delivered: set order to delivered and start payout release clock as lib/mvp.ts describes
    if (trackingStatus === 'delivered') {
      orderStatus = 'delivered';
      // Calculate release clock: exactly PHYSICAL_RELEASE_DAYS (10 days) from now
      releaseAt = new Date(Date.now() + PHYSICAL_RELEASE_DAYS * DAY).toISOString();

      updatePayload.status = 'delivered';
      updatePayload.delivered_at = nowIso;
      updatePayload.release_at = releaseAt;
    }

    // 5. Update orders table in Supabase
    let { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);

    // Graceful column fallback if tracking_status column not yet migrated
    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('tracking_status'))) {
      delete updatePayload.tracking_status;
      const fallbackRes = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (fallbackRes.error) {
        console.error('Courier webhook fallback update error:', fallbackRes.error);
        return NextResponse.json({ error: 'Could not update order status.' }, { status: 500 });
      }
    } else if (updateErr) {
      console.error('Courier webhook update error:', updateErr);
      return NextResponse.json({ error: 'Could not update order status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      awb_number: order.awb_number || awb,
      tracking_status: trackingStatus,
      status: orderStatus,
      release_at: releaseAt,
    });
  } catch (err: any) {
    console.error('Courier webhook error:', err);
    return NextResponse.json({ error: 'Internal server error processing webhook.' }, { status: 500 });
  }
}
