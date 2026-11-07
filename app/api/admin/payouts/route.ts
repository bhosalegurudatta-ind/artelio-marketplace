import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { executePayoutTransfer } from '@/lib/payoutTransfer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/payouts
 * Fetches all payouts along with linked account information, transfer status, and errors for review.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    let payouts: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('payouts')
        .select(`
          id,
          order_id,
          artist_id,
          sale_amount,
          commission_amount,
          payout_amount,
          status,
          created_at,
          released_at,
          transferred_at,
          transfer_reference,
          transfer_id,
          transfer_status,
          transfer_error,
          orders (
            id,
            status,
            created_at,
            artworks (
              id,
              title,
              price,
              medium,
              image_url
            )
          ),
          users:artist_id (
            id,
            name,
            email,
            linked_account_id,
            kyc_status,
            payout_account_number,
            payout_ifsc,
            payout_bank_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error && error.code === '42703') {
        // Fallback if transfer_id / transfer_status columns not yet migrated
        const { data: fallbackData } = await supabaseAdmin
          .from('payouts')
          .select(`
            id,
            order_id,
            artist_id,
            sale_amount,
            commission_amount,
            payout_amount,
            status,
            created_at,
            released_at,
            transferred_at,
            transfer_reference,
            orders (
              id,
              status,
              created_at,
              artworks (
                id,
                title,
                price,
                medium,
                image_url
              )
            ),
            users:artist_id (
              id,
              name,
              email,
              payout_account_number,
              payout_ifsc,
              payout_bank_name
            )
          `)
          .order('created_at', { ascending: false });
        payouts = fallbackData ?? [];
      } else {
        payouts = data ?? [];
      }
    } catch (e) {
      console.warn('Payouts fetch fallback error:', e);
    }

    const stats = {
      total: payouts.length,
      released: payouts.filter((p) => p.status === 'released').length,
      held: payouts.filter((p) => p.status === 'held').length,
      processed: payouts.filter((p) => p.transfer_status === 'processed' || p.transferred_at).length,
      failed: payouts.filter((p) => p.transfer_status === 'failed' || p.transfer_error).length,
      pending: payouts.filter((p) => p.status === 'released' && p.transfer_status !== 'processed' && !p.transferred_at && !p.transfer_error).length,
    };

    return NextResponse.json({
      success: true,
      payouts,
      stats,
    });
  } catch (err: any) {
    console.error('GET /api/admin/payouts error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch payouts.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/payouts
 * Retries an automated Razorpay Route transfer for a payout that failed or was pending.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { payoutId } = await req.json();
    if (!payoutId) {
      return NextResponse.json({ error: 'Payout ID required.' }, { status: 400 });
    }

    const result = await executePayoutTransfer(payoutId);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Transfer failed via Razorpay Route.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transferId: result.transferId,
      transferStatus: result.transferStatus,
      message: 'Transfer executed successfully.',
    });
  } catch (err: any) {
    console.error('POST /api/admin/payouts retry error:', err);
    return NextResponse.json({ error: err.message || 'Could not retry transfer.' }, { status: 500 });
  }
}
