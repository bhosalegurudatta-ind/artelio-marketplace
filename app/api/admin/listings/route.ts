import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/listings: search artworks by title, medium, or artist name
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    let query = supabaseAdmin
      .from('artworks')
      .select(`
        id,
        title,
        description,
        medium,
        price,
        image_url,
        sold,
        is_digital,
        is_hidden,
        takedown_reason,
        created_at,
        artist_id,
        users (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (q) {
      query = query.or(`title.ilike.%${q}%,medium.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: artworks, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      artworks: artworks ?? [],
    });
  } catch (err: any) {
    console.error('Admin listings GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/listings: "Take down" sets is_hidden = true and takedown_reason (or restore)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { artworkId, isHidden, takedownReason } = await req.json();

    if (!artworkId) {
      return NextResponse.json({ error: 'artworkId is required.' }, { status: 400 });
    }

    const hiddenValue = Boolean(isHidden);
    const reasonValue = hiddenValue ? (takedownReason?.trim() || 'Violates marketplace listing guidelines') : null;

    const { data: updated, error } = await supabaseAdmin
      .from('artworks')
      .update({
        is_hidden: hiddenValue,
        takedown_reason: reasonValue,
      })
      .eq('id', artworkId)
      .select('id, title, is_hidden, takedown_reason')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      artwork: updated,
    });
  } catch (err: any) {
    console.error('Admin listings POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
