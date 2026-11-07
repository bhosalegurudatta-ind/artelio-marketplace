import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function resolveDownload(req: NextRequest, orderId: string) {
  const user = await getUserFromRequest(req);
  if (!user) return { error: 'Please log in to download your artwork.', status: 401 };

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, status, artworks(id, title, original_path, image_url, is_digital)')
    .eq('id', orderId)
    .maybeSingle();

  const o: any = order;
  if (!o || o.customer_id !== user.id) return { error: 'Order not found or does not belong to you.', status: 404 };
  if (!['paid', 'shipped', 'delivered'].includes(o.status)) return { error: 'Payment is still processing for this order.', status: 403 };

  const art = Array.isArray(o.artworks) ? o.artworks[0] : o.artworks;
  if (!art) return { error: 'Artwork details unavailable.', status: 404 };

  // 1. If stored in Supabase storage bucket 'originals'
  if (art.original_path) {
    const { data } = await supabaseAdmin.storage.from('originals').createSignedUrl(art.original_path, 300, { download: true });
    if (data?.signedUrl) return { url: data.signedUrl };
  }

  // 2. Fallback to image_url
  if (art.image_url) {
    return { url: art.image_url };
  }

  return { error: 'No downloadable file associated with this artwork.', status: 404 };
}

// Gives a paying buyer a link to the full-quality original of a digital artwork.
export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const res = await resolveDownload(req, params.orderId);
    if (res.error) return fail(res.error, res.status || 400);
    return NextResponse.json({ url: res.url });
  } catch (err) {
    console.error('Download error:', err);
    return fail('Something went wrong.', 500);
  }
}

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const res = await resolveDownload(req, params.orderId);
    if (res.error) {
      return new NextResponse(`<html><body><p>${res.error}</p><a href="/orders">Back to orders</a></body></html>`, {
        status: res.status || 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    return NextResponse.redirect(new URL(res.url!, req.url));
  } catch (err) {
    console.error('Download GET error:', err);
    return fail('Could not process download.', 500);
  }
}
