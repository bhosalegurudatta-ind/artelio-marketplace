import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {

    // Fetch all payouts with orders, artworks, customer, and artist details
    const { data: payouts, error: pErr } = await supabaseAdmin
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
        transfer_reference,
        transferred_at,
        orders (
          id,
          artwork_id,
          customer_id,
          status,
          created_at,
          razorpay_payment_id,
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_state,
          artworks (
            id,
            title,
            image_url,
            medium,
            is_digital,
            sold
          ),
          users:customer_id (
            id,
            name,
            email
          )
        ),
        artists:artist_id (
          id,
          name,
          email,
          payout_method,
          payout_upi_id,
          payout_account_holder,
          payout_bank_name
        )
      `)
      .order('created_at', { ascending: false });

    if (pErr) {
      console.error('Fetch admin sales error:', pErr);
      return fail('Could not load sales ledger.', 500);
    }

    const records = payouts || [];

    // Financial calculations
    const totalAdminEarnings = records.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);
    const totalMarketplaceVolume = records.reduce((sum, r) => sum + Number(r.sale_amount || 0), 0);
    const totalArtistPayouts = records.reduce((sum, r) => sum + Number(r.payout_amount || 0), 0);
    const totalSoldArtworks = records.length;

    return NextResponse.json({
      summary: {
        totalAdminEarnings: Math.round(totalAdminEarnings * 100) / 100,
        totalMarketplaceVolume: Math.round(totalMarketplaceVolume * 100) / 100,
        totalArtistPayouts: Math.round(totalArtistPayouts * 100) / 100,
        totalSoldArtworks,
      },
      sales: records,
    });
  } catch (err: any) {
    console.error('Admin sales API error:', err);
    return fail('Internal server error.', 500);
  }
}
