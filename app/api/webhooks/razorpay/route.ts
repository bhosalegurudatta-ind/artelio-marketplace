import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/razorpay
 * Verifies X-Razorpay-Signature header with RAZORPAY_WEBHOOK_SECRET.
 * - On a charged event (subscription.charged): set paid_until to 30 days ahead and subscription_status to 'active'.
 * - On cancelled (subscription.cancelled): clear access at the end of the period (subscription_status='cancelled').
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured on server.' }, { status: 500 });
    }

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing X-Razorpay-Signature header.' }, { status: 400 });
    }

    const rawBody = await req.text();

    // 1. Verify HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const givenBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== givenBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, givenBuffer)
    ) {
      console.warn('Invalid Razorpay webhook signature received.');
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    // 2. Parse event payload
    const body = JSON.parse(rawBody);
    const event = body.event;
    const subEntity = body?.payload?.subscription?.entity;
    const paymentEntity = body?.payload?.payment?.entity;

    const subscriptionId = subEntity?.id || paymentEntity?.subscription_id;
    const noteUserId = subEntity?.notes?.user_id || paymentEntity?.notes?.user_id;

    // Locate target artist user
    let userId = noteUserId;
    if (!userId && subscriptionId) {
      const { data: userBySub } = await supabaseAdmin
        .from('users')
        .select('id, paid_until')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();

      if (userBySub) {
        userId = userBySub.id;
      }
    }

    if (!userId) {
      console.warn(`Webhook received for event "${event}" but no matching artist user found. Subscription ID: ${subscriptionId}`);
      return NextResponse.json({
        status: 'ignored',
        message: 'No matching artist user found for subscription/notes.',
      });
    }

    // 3. Process subscription events
    const isCharged = event === 'subscription.charged' || event === 'invoice.paid';
    const isCancelled = event === 'subscription.cancelled' || event === 'subscription.halted' || event === 'subscription.paused';

    if (isCharged) {
      // Set paid_until to 30 days ahead and subscription_status to active
      const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: err1 } = await supabaseAdmin
        .from('users')
        .update({
          paid_until: paidUntil,
          subscription_status: 'active',
          subscription_id: subscriptionId || undefined,
          approved: true,
        })
        .eq('id', userId);

      if (err1 && err1.code === '42703') {
        // Fallback if subscription_status/subscription_id column not yet created in Supabase
        await supabaseAdmin
          .from('users')
          .update({
            paid_until: paidUntil,
            approved: true,
          })
          .eq('id', userId);
      }

      console.log(`[Razorpay Webhook] User ${userId} subscription charged. Paid until ${paidUntil}. Status: active.`);
      return NextResponse.json({
        status: 'ok',
        event,
        userId,
        subscription_status: 'active',
        paid_until: paidUntil,
      });
    }

    if (isCancelled) {
      // On cancelled, keep paid_until as the end of the current period so access is cleared when the period expires.
      // subscription_status is set to cancelled.
      const { error: err2 } = await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'cancelled',
        })
        .eq('id', userId);

      if (err2 && err2.code === '42703') {
        // Column not yet migrated, nothing else to update
      }

      console.log(`[Razorpay Webhook] User ${userId} subscription cancelled. Access will end at the end of the paid period.`);
      return NextResponse.json({
        status: 'ok',
        event,
        userId,
        subscription_status: 'cancelled',
      });
    }

    return NextResponse.json({ status: 'ok', event, message: 'Event acknowledged.' });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
