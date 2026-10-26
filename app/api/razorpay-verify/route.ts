import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { COMMISSION_RATE, DIGITAL_RELEASE_DAYS, DAY } from '@/lib/mvp';

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

    const { data: artwork } = await supabaseAdmin
      .from('artworks').select('id, price, sold, is_digital, artist_id').eq('id', artworkId).single();
    if (!artwork) return fail('Artwork not found.', 404);

    // 4. The amount paid must match the price in our database.
    const price = Number(artwork.price);
    if (Number(rzpOrder.amount) !== Math.round(price * 100)) {
      console.error('Amount mismatch', { razorpay_payment_id, paid: rzpOrder.amount, price });
      return fail('The amount paid does not match the price. Please contact support.', 409);
    }

    // 5. Sold out in the meantime: record the payment as cancelled so it can be refunded.
    if (artwork.sold && !artwork.is_digital) {
      await supabaseAdmin.from('orders').insert({
        artwork_id: artwork.id, customer_id: user.id, status: 'cancelled', razorpay_payment_id,
      });
      return fail('Sorry, this piece was just sold to someone else. Contact support and we will refund your payment.', 409);
    }

    // 6. Record the order. Digital work is delivered at once, so its payout releases after 7 days.
    //    Physical work waits for shipping (see /ship) before its release clock starts.
    const now = Date.now();
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        artwork_id: artwork.id,
        customer_id: user.id,
        status: 'paid',
        razorpay_payment_id,
        delivered_at: artwork.is_digital ? new Date(now).toISOString() : null,
        release_at: artwork.is_digital ? new Date(now + DIGITAL_RELEASE_DAYS * DAY).toISOString() : null,
        shipping_name: shipping?.name ? String(shipping.name).trim() : null,
        shipping_phone: shipping?.phone ? String(shipping.phone).trim() : null,
        shipping_address: shipping?.address ? String(shipping.address).trim() : null,
        shipping_city: shipping?.city ? String(shipping.city).trim() : null,
        shipping_state: shipping?.state ? String(shipping.state).trim() : null,
        shipping_postal_code: shipping?.postalCode ? String(shipping.postalCode).trim() : null,
      })
      .select()
      .single();
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

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Payment verification error:', err);
    return fail('Something went wrong verifying payment.', 500);
  }
}
