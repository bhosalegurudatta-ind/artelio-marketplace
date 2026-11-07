import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId, contact } = await req.json();

    if (!orderId || !contact) {
      return NextResponse.json(
        { error: 'Please enter both your Order ID and the phone number or email used during purchase.' },
        { status: 400 }
      );
    }

    const cleanId = String(orderId).trim().toLowerCase().replace(/^order\s*#?/i, '');
    const cleanContact = String(contact).trim().toLowerCase();

    // Query orders matching ID (full UUID or prefix)
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        shipped_at,
        delivered_at,
        courier_name,
        tracking_note,
        tracking_url,
        awb_number,
        courier,
        label_url,
        tracking_status,
        shipping_name,
        shipping_phone,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        customer_id,
        artworks (
          id,
          title,
          price,
          medium,
          image_url,
          is_digital,
          artist_id,
          users (
            name
          )
        )
      `);

    if (cleanId.length === 36) {
      query = query.eq('id', cleanId);
    } else if (cleanId.startsWith('awb-') || cleanId.startsWith('del-')) {
      query = query.or(`awb_number.ilike.%${cleanId}%,tracking_note.ilike.%${cleanId}%`);
    } else {
      // Short prefix search
      query = query.ilike('id', `${cleanId}%`);
    }

    const initialRes = await query.limit(5);
    let matchedOrders: any = initialRes.data;
    let error: any = initialRes.error;

    // If new columns error, fallback
    if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
      const fallbackQuery = supabaseAdmin
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          shipped_at,
          delivered_at,
          courier_name,
          tracking_note,
          tracking_url,
          shipping_name,
          shipping_phone,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          customer_id,
          artworks (
            id,
            title,
            price,
            medium,
            image_url,
            is_digital,
            artist_id,
            users (
              name
            )
          )
        `);
      const fbRes = cleanId.length === 36
        ? await fallbackQuery.eq('id', cleanId).limit(5)
        : await fallbackQuery.ilike('id', `${cleanId}%`).limit(5);
      matchedOrders = fbRes.data;
      error = fbRes.error;
    }

    if (error || !matchedOrders || matchedOrders.length === 0) {
      return NextResponse.json(
        { error: 'No order found matching that Order ID. Please check your confirmation email or SMS.' },
        { status: 404 }
      );
    }

    // Verify contact verification: match phone, postal code, or user email
    let verifiedOrder: any = null;

    for (const ord of matchedOrders) {
      const phone = (ord.shipping_phone || '').replace(/\D/g, '');
      const inputDigits = cleanContact.replace(/\D/g, '');

      // Check phone match (last 10 digits or exact)
      if (inputDigits.length >= 5 && phone.includes(inputDigits)) {
        verifiedOrder = ord;
        break;
      }

      // Check postal code match
      if (ord.shipping_postal_code && ord.shipping_postal_code.trim() === cleanContact) {
        verifiedOrder = ord;
        break;
      }

      // Check customer email match
      if (ord.customer_id) {
        const { data: customerUser } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', ord.customer_id)
          .maybeSingle();

        if (customerUser?.email && customerUser.email.toLowerCase() === cleanContact) {
          verifiedOrder = ord;
          break;
        }
      }
    }

    if (!verifiedOrder) {
      return NextResponse.json(
        {
          error:
            'Order ID was found, but the phone number or email did not match the delivery record. Please check your input.',
        },
        { status: 403 }
      );
    }

    const art = verifiedOrder.artworks;

    return NextResponse.json({
      order: {
        id: verifiedOrder.id,
        created_at: verifiedOrder.created_at,
        status: verifiedOrder.status,
        shipped_at: verifiedOrder.shipped_at,
        delivered_at: verifiedOrder.delivered_at,
        courier_name: verifiedOrder.courier || verifiedOrder.courier_name,
        courier: verifiedOrder.courier || verifiedOrder.courier_name,
        awb_number: verifiedOrder.awb_number || verifiedOrder.tracking_note,
        label_url: verifiedOrder.label_url,
        tracking_status: verifiedOrder.tracking_status || (verifiedOrder.status === 'delivered' ? 'delivered' : verifiedOrder.status === 'shipped' ? 'in_transit' : 'label_created'),
        tracking_note: verifiedOrder.awb_number || verifiedOrder.tracking_note,
        tracking_url: verifiedOrder.tracking_url,
        shipping_name: verifiedOrder.shipping_name,
        shipping_city: verifiedOrder.shipping_city,
        shipping_state: verifiedOrder.shipping_state,
        shipping_postal_code: verifiedOrder.shipping_postal_code,
        artwork: {
          id: art?.id,
          title: art?.title,
          price: art?.price,
          medium: art?.medium,
          imageUrl: art?.image_url,
          isDigital: art?.is_digital,
          artistName: art?.users?.name || 'Verified Atelier Artist',
        },
      },
    });
  } catch (err) {
    console.error('Order tracking API error:', err);
    return NextResponse.json({ error: 'Failed to look up tracking details. Please try again.' }, { status: 500 });
  }
}
