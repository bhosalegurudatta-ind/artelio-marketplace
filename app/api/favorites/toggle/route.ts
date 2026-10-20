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

    // Check if already favorited
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId)
      .maybeSingle();

    if (checkError) {
      console.error('Favorites check error:', checkError);
      return NextResponse.json({
        error: 'Please run supabase-spaces.sql in Supabase SQL editor to enable database favorites.',
      }, { status: 500 });
    }

    if (existing) {
      // Remove favorite
      await supabaseAdmin.from('favorites').delete().eq('id', existing.id);
      return NextResponse.json({ success: true, favorited: false });
    } else {
      // Add favorite
      await supabaseAdmin.from('favorites').insert({
        user_id: user.id,
        artwork_id: artworkId,
      });
      return NextResponse.json({ success: true, favorited: true });
    }
  } catch (err: any) {
    console.error('Favorites toggle error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
