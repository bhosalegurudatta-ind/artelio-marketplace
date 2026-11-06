import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { COMMISSION_RATE, DIGITAL_RELEASE_DAYS, DAY } from '@/lib/mvp';
import { sendOrderEmails } from '@/lib/mailer';
import { sendNewOrderArtistEmail } from '@/lib/email';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, shipping } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return fail('Missing payment details.', 400);

    // 1. The signature proves this payment really came from Razorpay.
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const given = String(razorpay_signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) {
      return fail('Payment verification failed.', 400);
    }

    // 2. Already recorded (double click or retry)? Say so.
    const { data: already } = await supabaseAdmin
      .from('orders').select('id').eq('razorpay_payment_id', razorpay_payment_id).maybeSingle();
    if (already) return NextResponse.json({ success: true, orderId: already.id });

    // 3. Which artwork and buyer this payment was made for, from Razorpay itself.
    const rzpOrder: any = await razorpay.orders.fetch(razorpay_order_id);
    const artworkId = rzpOrder?.notes?.artwork_id;
    if (!artworkId || rzpOrder?.notes?.customer_id !== user.id) return fail('This payment does not belong to you.', 403);

    let artwork: any = null;
    const { data: artWithShipping, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, sold, is_digital, artist_id, shipping_fee')
      .eq('id', artworkId)
      .maybeSingle();

    if (artErr || !artWithShipping) {
      const { data: fallbackArt } = await supabaseAdmin
        .from('artworks')
        .select('id, title, price, sold, is_digital, artist_id')
        .eq('id', artworkId)
        .single();
      artwork = fallbackArt;
    } else {
      artwork = artWithShipping;
    }
    if (!artwork) return fail('Artwork not found.', 404);

    // 4. Check that the paid amount equals price + shipping_fee from our database
    const price = Number(artwork.price);
    const shippingFee = artwork.is_digital ? 0 : Number(artwork.shipping_fee || 0);
    const expectedTotal = price + shippingFee;

    if (Number(rzpOrder.amount) !== Math.round(expectedTotal * 100)) {
      console.error('Amount mismatch', { razorpay_payment_id, paid: rzpOrder.amount, expectedTotal });
      return fail('The amount paid does not match the price and shipping fee. Please contact support.', 409);
    }

    // 5. Sold out in the meantime: record the payment as cancelled so it can be refunded.
    if (artwork.sold && !artwork.is_digital) {
      await supabaseAdmin.from('orders').insert({
        artwork_id: artwork.id, customer_id: user.id, status: 'cancelled', razorpay_payment_id,
      });
      return fail('Sorry, this piece was just sold to someone else. Contact support and we will refund your payment.', 409);
    }

    // 6. Record the order with shipping_address and shipping_fee. Digital work is delivered at once.
    const now = Date.now();
    let formattedAddress = '';
    if (typeof shipping === 'string') {
      formattedAddress = shipping.trim();
    } else if (shipping && typeof shipping === 'object') {
      const parts = [
        shipping.name,
        shipping.phone && `Tel: ${shipping.phone}`,
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.postalCode,
      ].filter(Boolean);
      formattedAddress = parts.join(', ');
    }

    const orderPayload: Record<string, any> = {
      artwork_id: artwork.id,
      customer_id: user.id,
      status: 'paid',
      razorpay_payment_id,
      delivered_at: artwork.is_digital ? new Date(now).toISOString() : null,
      release_at: artwork.is_digital ? new Date(now + DIGITAL_RELEASE_DAYS * DAY).toISOString() : null,
      shipping_address: artwork.is_digital ? null : (formattedAddress || (shipping?.address ? String(shipping.address).trim() : null)),
      shipping_fee: shippingFee,
      shipping_name: shipping?.name ? String(shipping.name).trim() : null,
      shipping_phone: shipping?.phone ? String(shipping.phone).trim() : null,
      shipping_city: shipping?.city ? String(shipping.city).trim() : null,
      shipping_state: shipping?.state ? String(shipping.state).trim() : null,
      shipping_postal_code: shipping?.postalCode ? String(shipping.postalCode).trim() : null,
    };

    let { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError && orderError.message?.includes('shipping_fee')) {
      delete orderPayload.shipping_fee;
      const retry = await supabaseAdmin.from('orders').insert(orderPayload).select().single();
      order = retry.data;
      orderError = retry.error;
    }

    if (orderError || !order) {
      console.error('Order insert failed:', orderError);
      return fail('Could not record your order. Please contact support with your payment ID.', 500);
    }

    // 7. Split the money. The artist's share is HELD until delivery is confirmed.
    const commission = Math.round(price * COMMISSION_RATE * 100) / 100;
    const { error: payoutError } = await supabaseAdmin.from('payouts').insert({
      order_id: order.id,
      artist_id: artwork.artist_id,
      sale_amount: price,
      commission_amount: commission,
      payout_amount: Math.round((price - commission) * 100) / 100,
      status: 'held',
    });
    if (payoutError) console.error('Payout insert failed (order was saved):', payoutError);

    if (!artwork.is_digital) await supabaseAdmin.from('artworks').update({ sold: true }).eq('id', artwork.id);

    // 8. Fire transactional notifications asynchronously (Collector Receipt & Artist Dispatch Order)
    try {
      const { data: artistProfile } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', artwork.artist_id)
        .maybeSingle();

      const shippingFormatted = shipping?.address
        ? `${shipping.address}, ${shipping.city || ''}, ${shipping.state || ''} - ${shipping.postalCode || ''}`
        : null;

      // Send new order email to artist via lib/email
      if (artistProfile?.email) {
        sendNewOrderArtistEmail({
          to: artistProfile.email,
          artistName: artistProfile.name,
          orderId: order.id,
          artworkTitle: artwork.title,
          amount: price,
          buyerName: shipping?.name || 'Art Collector',
          shippingAddress: shippingFormatted,
          isDigital: artwork.is_digital,
        }).catch((emailErr) => console.error('[Razorpay Verify] Artist new order email error:', emailErr));
      }

      sendOrderEmails({
        orderId: order.id,
        artworkTitle: artwork.title,
        artworkPrice: price,
        isDigital: artwork.is_digital,
        buyerName: shipping?.name || 'Art Collector',
        buyerEmail: user.email,
        artistName: artistProfile?.name || 'Artelio Studio Creator',
        artistEmail: artistProfile?.email,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingState: shipping?.state,
        shippingPostalCode: shipping?.postalCode,
        shippingPhone: shipping?.phone,
      }).catch((emailErr) => console.error('[Mailer] Background order email dispatch error:', emailErr));
    } catch (e) {
      console.error('[Mailer] Could not prepare order notification data:', e);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Payment verification error:', err);
    return fail('Something went wrong verifying payment.', 500);
  }
}
