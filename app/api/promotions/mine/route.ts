import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select(`
        id,
        artwork_id,
        budget,
        spent,
        starts_at,
        ends_at,
        status,
        days,
        created_at,
        artworks (
          id,
          title,
          price,
          medium,
          image_url,
          is_digital
        )
      `)
      .eq('artist_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch artist promotions error:', error);
      return NextResponse.json({ error: 'Could not load promotions.' }, { status: 500 });
    }

    return NextResponse.json({ promotions: data ?? [] });
  } catch (err: any) {
    console.error('Promotions route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
