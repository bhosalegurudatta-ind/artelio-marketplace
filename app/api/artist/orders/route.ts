import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

// Everything the artist dashboard needs: order pipeline and earnings.
// Artists cannot read other people's orders directly, so this runs on the server.
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const { data: mine } = await supabaseAdmin.from('artworks').select('id').eq('artist_id', user.id);
  const ids = (mine ?? []).map((a: any) => a.id);
  if (ids.length === 0) return NextResponse.json({ orders: [] });

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, created_at, shipped_at, release_at, tracking_note, courier_name, tracking_url, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code, dispute_reason, artworks(title, price, is_digital, medium), payouts(payout_amount, status)')
    .in('artwork_id', ids)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}
