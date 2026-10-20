import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// Gives a paying buyer a link to the full-quality original of a digital artwork.
// The link works for 60 seconds, so it cannot be shared around.
export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, status, artworks(original_path, is_digital)')
      .eq('id', params.orderId)
      .single();

    const o: any = order;
    if (!o || o.customer_id !== user.id) return fail('Order not found.', 404);
    if (!['paid', 'shipped', 'delivered'].includes(o.status)) return fail('This order is not paid.', 403);

    const art = Array.isArray(o.artworks) ? o.artworks[0] : o.artworks;
    if (!art?.is_digital || !art?.original_path) return fail('This artwork has no digital download.', 400);

    const { data, error } = await supabaseAdmin.storage.from('originals').createSignedUrl(art.original_path, 60, { download: true });
    if (error || !data) return fail('Could not prepare your download.', 500);

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error('Download error:', err);
    return fail('Something went wrong.', 500);
  }
}
