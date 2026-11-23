import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { dHash, hamming } from '@/lib/imageTools';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Case 1: Image file upload for perceptual hash matching
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image');

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'Please provide an image file to verify.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let queryHash: string;
      try {
        queryHash = await dHash(buffer);
      } catch (err) {
        return NextResponse.json({ error: 'Could not process the uploaded image file.' }, { status: 400 });
      }

      // Query artworks catalog for image_hash matches
      const { data: artworks, error } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users:artist_id (id, name, email, verified)
        `)
        .not('image_hash', 'is', null)
        .limit(2000);

      if (error) {
        return NextResponse.json({ error: 'Failed to query provenance registry.' }, { status: 500 });
      }

      // Find closest hash within hamming distance <= 10
      let bestMatch: any = null;
      let lowestDistance = 64;

      for (const art of artworks || []) {
        if (!art.image_hash) continue;
        const dist = hamming(queryHash, art.image_hash);
        if (dist <= 10 && dist < lowestDistance) {
          lowestDistance = dist;
          bestMatch = art;
        }
      }

      if (!bestMatch) {
        return NextResponse.json({
          verified: false,
          computedHash: queryHash,
          message: 'No matching artwork record found in Artelio Provenance Registry. This piece may be unregistered, an external derivative, or altered.',
        });
      }

      return NextResponse.json({
        verified: true,
        matchConfidence: Math.round(((64 - lowestDistance) / 64) * 100),
        computedHash: queryHash,
        artwork: {
          id: bestMatch.id,
          title: bestMatch.title,
          medium: bestMatch.medium,
          price: bestMatch.price,
          imageUrl: bestMatch.image_url,
          isDigital: bestMatch.is_digital,
          isAiAssisted: bestMatch.is_ai_assisted,
          registeredAt: bestMatch.created_at,
          artistName: bestMatch.users?.name || 'Studio Master',
          artistVerified: Boolean(bestMatch.users?.verified),
          imageHash: bestMatch.image_hash,
        },
      });
    }

    // Case 2: JSON payload (query by ID, hash, or certificate string)
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Please enter an Artwork ID, Hash, or Title to verify.' }, { status: 400 });
    }

    // Search by exact ID first
    let { data: artwork } = await supabaseAdmin
      .from('artworks')
      .select(`
        id, title, description, medium, price, image_url, created_at,
        artist_id, is_digital, is_ai_assisted, image_hash,
        users:artist_id (id, name, email, verified)
      `)
      .eq('id', query)
      .maybeSingle();

    // If not found by ID, search by exact hash or case-insensitive title
    if (!artwork) {
      const { data: byHash } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users:artist_id (id, name, email, verified)
        `)
        .eq('image_hash', query)
        .maybeSingle();

      if (byHash) {
        artwork = byHash;
      } else {
        const { data: byTitle } = await supabaseAdmin
          .from('artworks')
          .select(`
            id, title, description, medium, price, image_url, created_at,
            artist_id, is_digital, is_ai_assisted, image_hash,
            users:artist_id (id, name, email, verified)
          `)
          .ilike('title', `%${query}%`)
          .limit(1)
          .maybeSingle();
        artwork = byTitle;
      }
    }

    if (!artwork) {
      return NextResponse.json({
        verified: false,
        query,
        message: 'No registered record found in the Artelio Provenance Registry for this query.',
      });
    }

    return NextResponse.json({
      verified: true,
      matchConfidence: 100,
      artwork: {
        id: artwork.id,
        title: artwork.title,
        medium: artwork.medium,
        price: artwork.price,
        imageUrl: artwork.image_url,
        isDigital: artwork.is_digital,
        isAiAssisted: artwork.is_ai_assisted,
        registeredAt: artwork.created_at,
        artistName: (artwork as any).users?.name || 'Studio Master',
        artistVerified: Boolean((artwork as any).users?.verified),
        imageHash: artwork.image_hash,
      },
    });
  } catch (err: any) {
    console.error('Provenance verification API error:', err);
    return NextResponse.json({ error: 'Provenance verification encountered an unexpected error.' }, { status: 500 });
  }
}
