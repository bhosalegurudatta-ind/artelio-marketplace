import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return fail('Missing Razorpay verification parameters.', 400);
    }

    // 1. Verify HMAC SHA-256 signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const given = String(razorpay_signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) {
      return fail('Payment verification signature check failed.', 400);
    }

    // 2. Prevent duplicate insertions for the same payment
    const { data: existingPromo } = await supabaseAdmin
      .from('promotions')
      .select('id, artwork_id, budget, starts_at, ends_at, status')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingPromo) {
      return NextResponse.json({ success: true, promotion: existingPromo, alreadyRecorded: true });
    }

    // 3. Fetch Razorpay order details from server to confirm notes
    const rzpOrder: any = await razorpay.orders.fetch(razorpay_order_id);
    const artworkId = rzpOrder?.notes?.artwork_id || body.artworkId;
    const artistId = rzpOrder?.notes?.artist_id || user.id;
    const budget = Number(rzpOrder?.notes?.budget || body.budget || (rzpOrder.amount / 100));
    const days = Math.round(Number(rzpOrder?.notes?.days || body.days || 7));

    if (artistId !== user.id) {
      return fail('This promotion payment belongs to a different artist account.', 403);
    }

    const now = Date.now();
    const startsAt = new Date(now).toISOString();
    const endsAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

    const insertPayload: Record<string, any> = {
      artwork_id: artworkId,
      artist_id: user.id,
      budget: budget,
      spent: 0, // Fixed fee promotion: no per-click deductions
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'active',
      days: days,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
    };

    let { data: promo, error: insertErr } = await supabaseAdmin
      .from('promotions')
      .insert(insertPayload)
      .select()
      .single();

    // If extra columns like days/razorpay IDs are not yet migrated in Supabase, fallback gracefully
    if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('does not exist'))) {
      delete insertPayload.days;
      delete insertPayload.razorpay_order_id;
      delete insertPayload.razorpay_payment_id;

      const fallbackRes = await supabaseAdmin
        .from('promotions')
        .insert(insertPayload)
        .select()
        .single();

      promo = fallbackRes.data;
      insertErr = fallbackRes.error;
    }

    if (insertErr || !promo) {
      console.error('Insert promotion error:', insertErr);
      return fail('Payment succeeded but could not record promotion.', 500);
    }

    return NextResponse.json({
      success: true,
      promotion: promo,
    });
  } catch (err: any) {
    console.error('Promotion verify error:', err);
    return fail('Internal server error verifying promotion.', 500);
  }
}
