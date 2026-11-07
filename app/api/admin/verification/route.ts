import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/verification: lists artists with at least 10 completed sales and no open disputes
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    // 1. Fetch all artist profiles
    const { data: artists, error: artistErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, bio, shop_name, banner_url, verified, created_at')
      .eq('role', 'artist')
      .order('created_at', { ascending: false });

    if (artistErr) throw artistErr;

    // 2. Fetch artworks to map artworks to their creator artists
    const { data: artworks, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, artist_id, is_digital, price');

    if (artErr) throw artErr;

    const artworkMap = new Map<string, { artist_id: string; is_digital: boolean; price: number }>();
    for (const art of artworks || []) {
      artworkMap.set(art.id, {
        artist_id: art.artist_id,
        is_digital: Boolean(art.is_digital),
        price: Number(art.price) || 0,
      });
    }

    // 3. Fetch orders to compute completed sales and disputes
    const { data: orders, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, artwork_id, status, dispute_reason');

    if (orderErr) throw orderErr;

    // Map metrics per artist
    const statsMap = new Map<string, { completedSales: number; openDisputes: number; totalVolume: number }>();

    for (const o of orders || []) {
      const art = artworkMap.get(o.artwork_id);
      if (!art || !art.artist_id) continue;

      const artistId = art.artist_id;
      const stats = statsMap.get(artistId) || { completedSales: 0, openDisputes: 0, totalVolume: 0 };

      // Completed sales: delivered physical order OR paid digital order
      if (o.status === 'delivered' || (art.is_digital && o.status === 'paid')) {
        stats.completedSales += 1;
        stats.totalVolume += art.price;
      }

      // Open disputes: orders marked disputed
      if (o.status === 'disputed' || o.dispute_reason) {
        stats.openDisputes += 1;
      }

      statsMap.set(artistId, stats);
    }

    // Enrich artists with stats
    const enrichedArtists = (artists || []).map((artist: any) => {
      const stats = statsMap.get(artist.id) || { completedSales: 0, openDisputes: 0, totalVolume: 0 };
      const isEligible = stats.completedSales >= 10 && stats.openDisputes === 0;

      return {
        id: artist.id,
        name: artist.name || 'Unnamed Artist',
        email: artist.email,
        bio: artist.bio,
        shop_name: artist.shop_name,
        banner_url: artist.banner_url,
        verified: Boolean(artist.verified),
        created_at: artist.created_at,
        completed_sales: stats.completedSales,
        open_disputes: stats.openDisputes,
        total_volume: stats.totalVolume,
        is_eligible: isEligible,
      };
    });

    // Requirement: Artists with at least 10 completed sales and no open disputes
    const qualifyingArtists = enrichedArtists.filter((a) => a.is_eligible);

    return NextResponse.json({
      success: true,
      artists: qualifyingArtists,
      allArtists: enrichedArtists,
      qualifyingCount: qualifyingArtists.length,
      totalArtistsCount: enrichedArtists.length,
    });
  } catch (err: any) {
    console.error('Admin verification GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load artists for verification' }, { status: 500 });
  }
}

// POST or PATCH /api/admin/verification: Admins can set users.verified to true or false
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { artistId, verified } = body;

    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required.' }, { status: 400 });
    }

    if (typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'verified must be a boolean.' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ verified })
      .eq('id', artistId)
      .eq('role', 'artist')
      .select('id, name, email, verified')
      .single();

    if (error || !updated) {
      console.error('Error updating artist verification:', error);
      return NextResponse.json({ error: 'Could not update artist verification status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      artist: updated,
    });
  } catch (err: any) {
    console.error('Admin verification update error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
