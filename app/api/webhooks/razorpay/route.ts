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

    // 3. Process Razorpay Route Transfer Webhook Events
    if (event.startsWith('transfer.')) {
      const transferEntity = body?.payload?.transfer?.entity;
      const transferId = transferEntity?.id;
      const newTransferStatus = transferEntity?.status || (event === 'transfer.processed' ? 'processed' : event === 'transfer.failed' ? 'failed' : 'settled');
      const transferError = transferEntity?.error?.description || transferEntity?.error_description || null;

      if (!transferId) {
        return NextResponse.json({ status: 'ignored', message: 'Missing transfer ID in webhook payload.' });
      }

      const updates: any = {
        transfer_status: newTransferStatus,
      };
      if (event === 'transfer.failed' || transferError) {
        updates.transfer_error = transferError || 'Transfer failed via Razorpay Route';
      } else if (newTransferStatus === 'processed' || newTransferStatus === 'settled') {
        updates.transfer_error = null;
        updates.transferred_at = new Date().toISOString();
      }

      // Locate payout record by transfer_id or notes.payout_id
      let { data: payoutRow } = await supabaseAdmin
        .from('payouts')
        .select('id, transfer_status')
        .eq('transfer_id', transferId)
        .maybeSingle();

      if (!payoutRow && transferEntity?.notes?.payout_id) {
        const { data: pByNote } = await supabaseAdmin
          .from('payouts')
          .select('id, transfer_status')
          .eq('id', transferEntity.notes.payout_id)
          .maybeSingle();
        payoutRow = pByNote;
      }

      if (payoutRow) {
        try {
          const { error: pUpdateErr } = await supabaseAdmin
            .from('payouts')
            .update(updates)
            .eq('id', payoutRow.id);

          if (pUpdateErr && pUpdateErr.code === '42703') {
            console.warn('[Webhook] transfer_status column missing on payouts table. Run supabase-route-payouts.sql.');
          }
        } catch (dbErr) {
          console.error('[Webhook] Failed updating payout transfer_status:', dbErr);
        }

        console.log(`[Razorpay Webhook] Payout ${payoutRow.id} transfer_status updated to "${newTransferStatus}".`);
      } else {
        console.warn(`[Razorpay Webhook] Transfer event for ${transferId} acknowledged, but no matching payout found in database.`);
      }

      return NextResponse.json({
        status: 'ok',
        event,
        transferId,
        transfer_status: newTransferStatus,
      });
    }

    // 4. Process Razorpay Route Linked Account Webhook Events
    if (event.startsWith('account.')) {
      const accountEntity = body?.payload?.account?.entity;
      const accountId = accountEntity?.id;
      const kycStatus = accountEntity?.status || event.replace('account.', '');

      if (accountId) {
        try {
          await supabaseAdmin
            .from('users')
            .update({ kyc_status: kycStatus })
            .eq('linked_account_id', accountId);
        } catch (dbErr) {
          console.error('[Webhook] Error updating linked account KYC status:', dbErr);
        }
        console.log(`[Razorpay Webhook] Linked account ${accountId} KYC status updated to "${kycStatus}".`);
      }

      return NextResponse.json({ status: 'ok', event, accountId, kycStatus });
    }

    // 5. Process subscription events
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
