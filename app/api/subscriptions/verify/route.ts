import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment signature details.' }, { status: 400 });
    }

    // 1. Verify Razorpay cryptographic signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const given = String(razorpay_signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    // 2. Fetch order metadata from Razorpay
    const rzpOrder: any = await razorpay.orders.fetch(razorpay_order_id);
    const planId = rzpOrder?.notes?.plan_id;
    const planUserId = rzpOrder?.notes?.user_id;

    if (!planId || planUserId !== user.id) {
      return NextResponse.json({ error: 'Payment does not belong to this user account.' }, { status: 403 });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
    }

    // 3. Calculate new paid_until extension date
    const daysToAdd = plan.billingInterval === 'year' ? 365 : 30;
    const { data: currentProfile } = await supabaseAdmin
      .from('users')
      .select('paid_until')
      .eq('id', user.id)
      .single();

    const currentPaidUntil = currentProfile?.paid_until ? new Date(currentProfile.paid_until).getTime() : 0;
    const baseTime = currentPaidUntil > Date.now() ? currentPaidUntil : Date.now();
    const newPaidUntil = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    // 4. Update the user account in database with active paid status and approved access
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        paid_until: newPaidUntil,
        approved: true, // Upgrading immediately approves listing access
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user subscription status:', updateError);
      return NextResponse.json({ error: 'Payment verified, but account update failed. Contact support.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      planName: plan.name,
      paidUntil: newPaidUntil,
      message: `Your ${plan.name} has been activated! Active until ${new Date(newPaidUntil).toLocaleDateString()}.`,
    });
  } catch (err: any) {
    console.error('Subscription verification error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed.' }, { status: 500 });
  }
}
