import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { createCourierLabel } from '@/lib/courier';

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const orderId = params.id;
    if (!orderId) return fail('Order ID required.', 400);

    // Fetch order and associated artwork to verify ownership
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        artwork_id,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        awb_number,
        courier,
        courier_name,
        label_url,
        tracking_status,
        tracking_note,
        tracking_url,
        artworks (
          id,
          title,
          price,
          artist_id,
          ships_from,
          is_digital
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return fail('Order not found.', 404);
    }

    const artwork: any = order.artworks;
    if (!artwork || artwork.artist_id !== user.id) {
      return fail('Only the artist who created this artwork can generate its shipping label.', 403);
    }

    if (artwork.is_digital) {
      return fail('Digital artworks are delivered electronically and do not require shipping labels.', 400);
    }

    // If label has already been generated, return the existing details
    if (order.awb_number && order.label_url) {
      return NextResponse.json({
        success: true,
        alreadyCreated: true,
        awb_number: order.awb_number,
        courier: order.courier || order.courier_name || 'Delhivery Express',
        label_url: order.label_url,
        tracking_status: order.tracking_status || 'label_created',
      });
    }

    // Prepare ships_from and destination address
    const shipsFrom = artwork.ships_from?.trim() || 'Art Studio Atelier, India';
    const recipient = {
      name: order.shipping_name?.trim() || 'Art Collector',
      phone: order.shipping_phone?.trim() || '',
      address: order.shipping_address?.trim() || 'Delivery Address Provided at Checkout',
      city: order.shipping_city?.trim() || 'Delivery Hub',
      state: order.shipping_state?.trim() || 'India',
      postalCode: order.shipping_postal_code?.trim() || '000000',
    };

    // Call courier API with ships_from and buyer address
    const courierResult = await createCourierLabel({
      orderId,
      shipsFrom,
      recipient,
      artworkTitle: artwork.title,
      declaredValue: artwork.price,
    });

    const updatePayload: Record<string, any> = {
      awb_number: courierResult.awb_number,
      courier: courierResult.courier,
      label_url: courierResult.label_url,
      tracking_status: courierResult.tracking_status,
      // Keep legacy fields populated for backwards compatibility
      courier_name: courierResult.courier,
      tracking_note: courierResult.awb_number,
      tracking_url: courierResult.tracking_url,
    };

    // Save to orders table in Supabase
    let { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    // If new columns are not yet migrated in Supabase, fallback gracefully
    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('does not exist'))) {
      delete updatePayload.awb_number;
      delete updatePayload.courier;
      delete updatePayload.label_url;
      delete updatePayload.tracking_status;

      const fallbackRes = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (fallbackRes.error) {
        console.error('Fallback update order label error:', fallbackRes.error);
        return fail('Could not save courier label to order.', 500);
      }
    } else if (updateErr) {
      console.error('Update order label error:', updateErr);
      return fail('Could not save courier label to order.', 500);
    }

    return NextResponse.json({
      success: true,
      awb_number: courierResult.awb_number,
      courier: courierResult.courier,
      label_url: courierResult.label_url,
      tracking_url: courierResult.tracking_url,
      tracking_status: courierResult.tracking_status,
    });
  } catch (err: any) {
    console.error('Generate label route error:', err);
    return fail('Internal server error generating courier label.', 500);
  }
}
