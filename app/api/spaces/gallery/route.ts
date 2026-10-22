import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    // 1. Fetch public community room mockups
    const { data: publicMockups } = await supabaseAdmin
      .from('room_mockups')
      .select('id, image_url, title, room_style, harmony_score, created_at, artworks(id, title, price, image_url, medium)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    let myMockups: any[] = [];
    let myFavorites: any[] = [];

    if (user) {
      // 2. Fetch user's own room mockups
      const { data: userMockups } = await supabaseAdmin
        .from('room_mockups')
        .select('id, image_url, title, room_style, harmony_score, is_public, created_at, artworks(id, title, price, image_url, medium)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      myMockups = userMockups || [];

      // 3. Fetch user's favorited artworks
      const { data: favs } = await supabaseAdmin
        .from('favorites')
        .select('id, created_at, artworks(id, title, price, medium, image_url, sold, users(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      myFavorites = (favs || []).map((f: any) => ({
        id: f.id,
        createdAt: f.created_at,
        artwork: f.artworks ? {
          id: f.artworks.id,
          title: f.artworks.title,
          price: f.artworks.price,
          medium: f.artworks.medium,
          imageUrl: f.artworks.image_url,
          sold: f.artworks.sold,
          artist: f.artworks.users?.name || 'Independent Artist',
        } : null,
      })).filter((f: any) => f.artwork !== null);
    }

    return NextResponse.json({
      success: true,
      myMockups,
      myFavorites,
      communityMockups: publicMockups || [],
    });
  } catch (err: any) {
    console.error('Spaces gallery route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
