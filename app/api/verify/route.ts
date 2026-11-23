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
          users (id, name, email, role, approved)
        `)
        .not('image_hash', 'is', null)
        .limit(2000);

      if (error) {
        console.error('Error fetching artworks for verification:', error);
        return NextResponse.json({ error: 'Failed to query provenance registry.' }, { status: 500 });
      }

      // Find closest hash within hamming distance <= 16 (perceptual tolerance)
      let bestMatch: any = null;
      let lowestDistance = 64;

      for (const art of artworks || []) {
        if (!art.image_hash) continue;
        const dist = hamming(queryHash, art.image_hash);
        if (dist <= 16 && dist < lowestDistance) {
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

      const artistObj = Array.isArray(bestMatch.users) ? bestMatch.users[0] : bestMatch.users;

      return NextResponse.json({
        verified: true,
        matchConfidence: Math.max(65, Math.round(((64 - lowestDistance) / 64) * 100)),
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
          artistName: artistObj?.name || 'Studio Master',
          artistVerified: Boolean(artistObj?.approved ?? true),
          imageHash: bestMatch.image_hash,
        },
      });
    }

    // Case 2: JSON payload (query by ID, Certificate, Hash, or Title)
    const body = await req.json().catch(() => ({}));
    let query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Please enter an Artwork ID, Certificate Number, or Title to verify.' }, { status: 400 });
    }

    let matchedArtworkId: string | null = null;
    let certificateDetails: { number: string; type: string } | null = null;

    // Check if query is a Certificate Number (e.g., COA-ART-2BF41EB9-SACR)
    if (query.toUpperCase().startsWith('COA-')) {
      certificateDetails = { number: query.toUpperCase(), type: 'Certificate of Authenticity (CoA)' };
      const parts = query.split('-');
      // parts[2] is the order ID prefix e.g. "2BF41EB9"
      const orderPrefix = parts[2] ? parts[2].toLowerCase() : '';
      if (orderPrefix) {
        const { data: orderMatch } = await supabaseAdmin
          .from('orders')
          .select('id, artwork_id, status, created_at')
          .ilike('id', `${orderPrefix}%`)
          .limit(1)
          .maybeSingle();

        if (orderMatch && orderMatch.artwork_id) {
          matchedArtworkId = orderMatch.artwork_id;
        }
      }
    }

    let artwork: any = null;

    // 1. If certificate matched an artwork ID:
    if (matchedArtworkId) {
      const { data } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users (id, name, email, role, approved)
        `)
        .eq('id', matchedArtworkId)
        .maybeSingle();
      artwork = data;
    }

    // 2. Search by exact or partial Artwork UUID
    if (!artwork) {
      // Exact UUID
      const { data } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users (id, name, email, role, approved)
        `)
        .eq('id', query)
        .maybeSingle();
      artwork = data;
    }

    // 3. Search by partial UUID prefix
    if (!artwork && query.length >= 6) {
      const { data } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users (id, name, email, role, approved)
        `)
        .ilike('id', `${query}%`)
        .limit(1)
        .maybeSingle();
      artwork = data;
    }

    // 4. Search by exact perceptual hash
    if (!artwork) {
      const { data: byHash } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users (id, name, email, role, approved)
        `)
        .eq('image_hash', query)
        .maybeSingle();
      artwork = byHash;
    }

    // 5. Search by title (case-insensitive substring)
    if (!artwork) {
      // Strip any punctuation or prefixes if user typed partially
      const cleanTitle = query.replace(/^COA-ART-[^-]+-?/i, '').trim();
      const searchTerm = cleanTitle.length > 2 ? cleanTitle : query;

      const { data: byTitle } = await supabaseAdmin
        .from('artworks')
        .select(`
          id, title, description, medium, price, image_url, created_at,
          artist_id, is_digital, is_ai_assisted, image_hash,
          users (id, name, email, role, approved)
        `)
        .ilike('title', `%${searchTerm}%`)
        .limit(1)
        .maybeSingle();
      artwork = byTitle;
    }

    // 6. If still not found, check orders by order ID prefix
    if (!artwork && query.length >= 6) {
      const cleanId = query.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36);
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('artwork_id')
        .ilike('id', `${cleanId}%`)
        .limit(1)
        .maybeSingle();

      if (order?.artwork_id) {
        const { data: artFromOrder } = await supabaseAdmin
          .from('artworks')
          .select(`
            id, title, description, medium, price, image_url, created_at,
            artist_id, is_digital, is_ai_assisted, image_hash,
            users (id, name, email, role, approved)
          `)
          .eq('id', order.artwork_id)
          .maybeSingle();
        artwork = artFromOrder;
      }
    }

    if (!artwork) {
      return NextResponse.json({
        verified: false,
        query,
        message: 'No registered record found in the Artelio Provenance Registry for this query.',
      });
    }

    const artistObj = Array.isArray(artwork.users) ? artwork.users[0] : artwork.users;

    return NextResponse.json({
      verified: true,
      matchConfidence: 100,
      certificate: certificateDetails,
      artwork: {
        id: artwork.id,
        title: artwork.title,
        medium: artwork.medium,
        price: artwork.price,
        imageUrl: artwork.image_url,
        isDigital: artwork.is_digital,
        isAiAssisted: artwork.is_ai_assisted,
        registeredAt: artwork.created_at,
        artistName: artistObj?.name || 'Studio Master',
        artistVerified: Boolean(artistObj?.approved ?? true),
        imageHash: artwork.image_hash,
      },
    });
  } catch (err: any) {
    console.error('Provenance verification API error:', err);
    return NextResponse.json({ error: 'Provenance verification encountered an unexpected error.' }, { status: 500 });
  }
}
