import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const adminKey = req.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_KEY || 'artelio-admin-2026';

    const isAuthorizedByAdminKey = adminKey && adminKey === expectedKey;
    const isOwnerEmail = user?.email && (
      user.email === 'bhosalegurudatta@gmail.com' ||
      user.email.endsWith('@artelio.in') ||
      user.user_metadata?.role === 'admin'
    );

    if (!isAuthorizedByAdminKey && !isOwnerEmail) {
      return fail('Unauthorized. Admin access required.', 403);
    }

    const { payoutId, orderId, transferReference } = await req.json();
    if (!payoutId && !orderId) {
      return fail('Missing payout ID or order ID.', 400);
    }

    const updates: Record<string, any> = {
      status: 'released',
      transferred_at: new Date().toISOString(),
      transfer_reference: transferReference || `UPI-TXN-${Date.now().toString().slice(-6)}`,
    };

    let query = supabaseAdmin.from('payouts').update(updates);
    if (payoutId) {
      query = query.eq('id', payoutId);
    } else {
      query = query.eq('order_id', orderId);
    }

    const { error } = await query;
    if (error) {
      console.error('Settle payout error:', error);
      return fail('Failed to record payout settlement.', 500);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout marked as successfully transferred to artist UPI.',
      reference: updates.transfer_reference,
    });
  } catch (err: any) {
    console.error('Settle payout API error:', err);
    return fail('Internal server error.', 500);
  }
}
