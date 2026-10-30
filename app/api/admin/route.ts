import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(req: NextRequest) {
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

    // If neither admin key nor owner email, check if user has admin role in database
    let isDbAdmin = false;
    if (user && !isOwnerEmail) {
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (dbUser?.role === 'admin') isDbAdmin = true;
    }

    if (!isAuthorizedByAdminKey && !isOwnerEmail && !isDbAdmin) {
      return fail('Unauthorized. Admin access required.', 403);
    }

    // 1. Fetch Users (Artists and Customers)
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, payout_upi_id, payout_method, payout_account_holder, created_at')
      .order('created_at', { ascending: false });

    if (usersErr) throw usersErr;

    const allUsers = users || [];
    const artists = allUsers.filter((u) => u.role === 'artist');
    const customers = allUsers.filter((u) => u.role === 'customer');

    // 2. Fetch Artworks
    const { data: artworks, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, sold, is_digital, artist_id, image_url, created_at')
      .order('created_at', { ascending: false });

    if (artErr) throw artErr;

    const allArtworks = artworks || [];
    const soldArtworks = allArtworks.filter((a) => a.sold);
    const activeArtworks = allArtworks.filter((a) => !a.sold);

    // 3. Fetch Orders with Artworks, Buyer, and Payout details
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        shipped_at,
        delivered_at,
        courier_name,
        tracking_note,
        tracking_url,
        shipping_name,
        shipping_phone,
        shipping_city,
        shipping_state,
        artworks (
          id,
          title,
          price,
          image_url,
          is_digital,
          artist_id
        ),
        payouts (
          id,
          sale_amount,
          commission_amount,
          payout_amount,
          status,
          transfer_reference,
          transferred_at
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersErr) throw ordersErr;

    const allOrders = orders || [];

    // Calculate Financials & Commission
    let totalGMV = 0;
    let totalCommission = 0;
    let totalArtistPayouts = 0;
    let settledPayouts = 0;
    let pendingPayouts = 0;

    allOrders.forEach((o: any) => {
      const art = o.artworks;
      const payout = Array.isArray(o.payouts) ? o.payouts[0] : o.payouts;

      if (o.status !== 'cancelled' && art?.price) {
        const price = Number(art.price);
        totalGMV += price;

        const commission = payout?.commission_amount ? Number(payout.commission_amount) : price * 0.10;
        const artistShare = payout?.payout_amount ? Number(payout.payout_amount) : price * 0.90;

        totalCommission += commission;
        totalArtistPayouts += artistShare;

        if (payout?.status === 'released' || payout?.transferred_at) {
          settledPayouts += artistShare;
        } else {
          pendingPayouts += artistShare;
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalArtists: artists.length,
        totalCustomers: customers.length,
        totalUsers: allUsers.length,
        totalArtworks: allArtworks.length,
        totalSold: soldArtworks.length,
        totalActive: activeArtworks.length,
        totalOrders: allOrders.length,
        totalGMV,
        totalCommission, // 10% kept by platform
        totalArtistPayouts, // 90% sent to artists
        settledPayouts,
        pendingPayouts,
      },
      orders: allOrders,
      artists: artists,
      customers: customers,
    });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return fail(err.message || 'Internal server error', 500);
  }
}
