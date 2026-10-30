import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { dHash, hamming, makePreview } from '@/lib/imageTools';
import { hasListingAccess } from '@/lib/mvp';

export const runtime = 'nodejs';

// Vercel limits a request body to about 4.5 MB, so keep originals under 4 MB for now.
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DUPLICATE_DISTANCE = 6; // out of 64 bits; lower means stricter

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  const uploaded: { bucket: string; path: string }[] = [];

  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in first to upload artwork.', 401);

    // Ensure the user exists in public.users table so foreign keys work
    let { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role, name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const meta = user.user_metadata || {};
      const name = meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'Creator');
      const { data: newProfile, error: pErr } = await supabaseAdmin
        .from('users')
        .upsert({
          id: user.id,
          name,
          email: user.email || '',
          role: meta.role === 'artist' ? 'artist' : 'customer',
          approved: true,
        })
        .select('id, role, name')
        .single();
      if (pErr) console.error('Error auto-creating profile on upload:', pErr);
      profile = newProfile;
    }

    const form = await req.formData();
    const file = form.get('image');
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const medium = String(form.get('medium') ?? '').trim();
    const price = Number(form.get('price'));
    const isDigital = form.get('isDigital') === 'true';
    const isAiAssisted = form.get('isAiAssisted') === 'true';

    if (!title || title.length > 120) return fail('Please give your artwork a title (up to 120 characters).', 400);
    if (!Number.isFinite(price) || price < 1 || price > 10000000) return fail('Please enter a price between ₹1 and ₹1,00,00,000.', 400);
    if (!(file instanceof File)) return fail('Please choose an image.', 400);
    if (!TYPES.includes(file.type)) return fail('Please use a JPG, PNG or WebP image.', 400);
    if (file.size > MAX_BYTES) return fail('Image is too large (max 4 MB for now).', 400);

    const original = Buffer.from(await file.arrayBuffer());

    // 1. Duplicate check against everything already listed.
    let hash: string;
    try {
      hash = await dHash(original);
    } catch {
      return fail('We could not read that image. Try saving it again as a JPG or PNG.', 400);
    }

    const { data: existing } = await supabaseAdmin
      .from('artworks')
      .select('artist_id, image_hash')
      .not('image_hash', 'is', null)
      .limit(5000);

    const match = (existing ?? []).find((e: any) => e.image_hash && hamming(e.image_hash, hash) <= DUPLICATE_DISTANCE);
    if (match) {
      return fail(
        match.artist_id === user.id
          ? 'You have already listed this image.'
          : 'This image looks the same as a piece already listed by another artist, so we could not publish it. If it is your own work, please contact us.',
        409
      );
    }

    // 2. Public preview: smaller and watermarked. This is the only version the public ever sees.
    const preview = await makePreview(original);
    const stamp = Date.now();
    const previewPath = `${user.id}/${stamp}.jpg`;
    const { error: previewError } = await supabaseAdmin.storage
      .from('artworks')
      .upload(previewPath, preview, { contentType: 'image/jpeg' });
    if (previewError) {
      console.error('Preview upload failed:', previewError);
      return fail('Could not save the image. Please try again.', 500);
    }
    uploaded.push({ bucket: 'artworks', path: previewPath });

    // 3. Digital art only: keep the full-quality original in the private bucket for paying buyers.
    let originalPath: string | null = null;
    if (isDigital) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      originalPath = `${user.id}/${stamp}-${safeName}`;
      const { error: originalError } = await supabaseAdmin.storage
        .from('originals')
        .upload(originalPath, original, { contentType: file.type });
      if (originalError) {
        console.error('Original upload failed:', originalError);
        throw new Error('original upload failed');
      }
      uploaded.push({ bucket: 'originals', path: originalPath });
    }

    // 4. Save the listing.
    const { data: row, error: insertError } = await supabaseAdmin
      .from('artworks')
      .insert({
        artist_id: user.id,
        title,
        description,
        medium,
        price,
        image_url: supabaseAdmin.storage.from('artworks').getPublicUrl(previewPath).data.publicUrl,
        image_hash: hash,
        is_digital: isDigital,
        is_ai_assisted: isAiAssisted,
        original_path: originalPath,
      })
      .select('id')
      .single();
    if (insertError || !row) throw insertError ?? new Error('insert failed');

    return NextResponse.json({ id: row.id });
  } catch (err) {
    console.error('Artwork upload error:', err);
    // Do not leave half-finished files behind.
    for (const u of uploaded) await supabaseAdmin.storage.from(u.bucket).remove([u.path]);
    return fail('Something went wrong while listing your artwork.', 500);
  }
}
