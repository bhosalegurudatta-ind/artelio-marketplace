import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/follows:
// - If ?artistId: returns { isFollowing, followerCount }
// - Otherwise: returns list of followed artists for logged-in user
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const artistId = searchParams.get('artistId');

    if (artistId) {
      // 1. Get follower count for this artist
      const { count, error: countErr } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);

      if (countErr) {
        console.error('Error fetching follower count:', countErr);
      }

      // 2. Check if current user is following this artist
      let isFollowing = false;
      if (user) {
        const { data: followRow } = await supabaseAdmin
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('artist_id', artistId)
          .maybeSingle();

        isFollowing = Boolean(followRow);
      }

      return NextResponse.json({
        success: true,
        artistId,
        followerCount: count || 0,
        isFollowing,
        isSelf: user ? user.id === artistId : false,
      });
    }

    // If no artistId provided, return all artists followed by logged-in user
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: followRows, error: fErr } = await supabaseAdmin
      .from('follows')
      .select('artist_id, created_at')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (fErr) throw fErr;

    const artistIds = (followRows || []).map((r) => r.artist_id).filter(Boolean);

    if (artistIds.length === 0) {
      return NextResponse.json({
        success: true,
        followedArtists: [],
        followedIds: [],
      });
    }

    const { data: artists, error: aErr } = await supabaseAdmin
      .from('users')
      .select('id, name, shop_name, bio, banner_url, verified')
      .in('id', artistIds);

    if (aErr) throw aErr;

    return NextResponse.json({
      success: true,
      followedArtists: artists || [],
      followedIds: artistIds,
    });
  } catch (err: any) {
    console.error('GET /api/follows error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch follows' }, { status: 500 });
  }
}

// POST /api/follows:
// Follow or unfollow an artist for the logged-in user
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to follow this artist.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { artistId, action } = body; // action: 'follow' | 'unfollow' | 'toggle'

    if (!artistId) {
      return NextResponse.json({ error: 'artistId is required.' }, { status: 400 });
    }

    if (user.id === artistId) {
      return NextResponse.json({ error: 'You cannot follow your own artist profile.' }, { status: 400 });
    }

    // Check existing follow
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('artist_id', artistId)
      .maybeSingle();

    const currentlyFollowing = Boolean(existingFollow);
    let shouldFollow: boolean;

    if (action === 'follow') {
      shouldFollow = true;
    } else if (action === 'unfollow') {
      shouldFollow = false;
    } else {
      // Toggle
      shouldFollow = !currentlyFollowing;
    }

    if (shouldFollow) {
      // Upsert follow
      const { error: insErr } = await supabaseAdmin
        .from('follows')
        .upsert(
          { follower_id: user.id, artist_id: artistId },
          { onConflict: 'follower_id,artist_id' }
        );

      if (insErr) {
        console.error('Follow insert error:', insErr);
        return NextResponse.json({ error: 'Failed to follow artist.' }, { status: 500 });
      }
    } else {
      // Delete follow
      const { error: delErr } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('artist_id', artistId);

      if (delErr) {
        console.error('Follow delete error:', delErr);
        return NextResponse.json({ error: 'Failed to unfollow artist.' }, { status: 500 });
      }
    }

    // Get updated follower count
    const { count } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    return NextResponse.json({
      success: true,
      isFollowing: shouldFollow,
      followerCount: count || 0,
    });
  } catch (err: any) {
    console.error('POST /api/follows error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
