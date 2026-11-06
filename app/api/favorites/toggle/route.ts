import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to save favorites.' }, { status: 401 });
    }

    const { artworkId } = await req.json();
    if (!artworkId) {
      return NextResponse.json({ error: 'Missing artwork ID.' }, { status: 400 });
    }

    // Check if already favorited in favorites or favourites
    let tableName = 'favourites';
    let { data: existing, error: checkError } = await supabaseAdmin
      .from('favourites')
      .select('artwork_id')
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId)
      .maybeSingle();

    if (checkError) {
      tableName = 'favorites';
      const fallback = await supabaseAdmin
        .from('favorites')
        .select('artwork_id')
        .eq('user_id', user.id)
        .eq('artwork_id', artworkId)
        .maybeSingle();
      existing = fallback.data;
    }

    if (existing) {
      // Remove favorite
      await supabaseAdmin.from(tableName).delete().match({ user_id: user.id, artwork_id: artworkId });
      try {
        const otherTable = tableName === 'favourites' ? 'favorites' : 'favourites';
        await supabaseAdmin.from(otherTable).delete().match({ user_id: user.id, artwork_id: artworkId });
      } catch {}
      return NextResponse.json({ success: true, favorited: false });
    } else {
      // Add favorite
      const ins = await supabaseAdmin.from(tableName).insert({
        user_id: user.id,
        artwork_id: artworkId,
      });
      if (ins.error && tableName === 'favourites') {
        await supabaseAdmin.from('favorites').insert({
          user_id: user.id,
          artwork_id: artworkId,
        });
      }
      return NextResponse.json({ success: true, favorited: true });
    }
  } catch (err: any) {
    console.error('Favorites toggle error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
