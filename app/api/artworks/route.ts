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
      .select('id, role, name, payout_upi_id, payout_method')
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
        .select('id, role, name, payout_upi_id, payout_method')
        .single();
      if (pErr) console.error('Error auto-creating profile on upload:', pErr);
      profile = newProfile;
    }

    // Enforce Rule 1: ONLY verified artists can add/list artwork - nobody else
    if (profile?.role !== 'artist') {
      return fail('Only verified artist accounts can list artworks. Please switch to an artist account in Settings to upload.', 403);
    }

    // Enforce Rule 2: Compulsory payment details (UPI ID required for payouts after commission)
    if (!profile?.payout_upi_id && !profile?.payout_method) {
      return fail('Compulsory payout details required: You must provide your UPI ID to receive payments after platform commission before listing artwork.', 400);
    }

    const form = await req.formData();
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const medium = String(form.get('medium') ?? '').trim();
    const price = Number(form.get('price'));
    const isDigital = form.get('isDigital') === 'true';
    const isAiAssisted = form.get('isAiAssisted') === 'true';

    // Parse shipping fee and ships from (Requirement 1)
    const rawShippingFee = form.get('shipping_fee') ?? form.get('shippingFee');
    const shippingFee = rawShippingFee !== null ? Math.max(0, Math.round(Number(rawShippingFee) || 0)) : 0;
    const shipsFrom = String(form.get('ships_from') ?? form.get('shipsFrom') ?? '').trim();

    // Parse and validate tags: up to 13 tags, lowercase, trimmed, no duplicates, max 20 characters each
    let rawTags: string[] = [];
    const tagsParam = form.get('tags');
    if (tagsParam) {
      if (typeof tagsParam === 'string') {
        try {
          const parsed = JSON.parse(tagsParam);
          if (Array.isArray(parsed)) rawTags = parsed;
          else rawTags = tagsParam.split(',');
        } catch {
          rawTags = tagsParam.split(',');
        }
      }
    } else {
      const allTags = form.getAll('tags');
      if (allTags.length > 0) rawTags = allTags.map(String);
    }

    const cleanTags = Array.from(
      new Set(
        rawTags
          .map((t) => String(t).toLowerCase().trim().slice(0, 20))
          .filter((t) => t.length > 0)
      )
    ).slice(0, 13);

    // 1. Collect files: accepts up to 6 files in "images", keeps single-image "image" working
    let files: File[] = [];
    const multiImages = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (multiImages.length > 0) {
      files = multiImages;
    } else {
      const singleImage = form.get('image');
      if (singleImage instanceof File && singleImage.size > 0) {
        files = [singleImage];
      }
    }

    if (files.length === 0) return fail('Please choose at least one image.', 400);
    if (files.length > 6) return fail('You can upload a maximum of 6 photos per artwork.', 400);

    if (!title || title.length > 120) return fail('Please give your artwork a title (up to 120 characters).', 400);
    if (!Number.isFinite(price) || price < 1 || price > 10000000) return fail('Please enter a price between ₹1 and ₹1,00,00,000.', 400);

    // Validate 4 MB limit and allowed image type for each photo
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!TYPES.includes(f.type)) return fail(`Photo #${i + 1} (${f.name}): Please use a JPG, PNG or WebP image.`, 400);
      if (f.size > MAX_BYTES) return fail(`Photo #${i + 1} (${f.name}) is too large (max 4 MB per photo).`, 400);
    }

    // Process all photos (watermarked preview, fingerprint, and original storage)
    type ProcessedPhoto = {
      hash: string;
      previewUrl: string;
      originalPath: string | null;
    };
    const processedPhotos: ProcessedPhoto[] = [];
    const stamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const original = Buffer.from(await f.arrayBuffer());

      // Fingerprint / dHash
      let hash: string;
      try {
        hash = await dHash(original);
      } catch {
        return fail(`We could not read photo #${i + 1}. Try saving it again as a JPG or PNG.`, 400);
      }

      // Duplicate check for the primary photo against existing artwork catalog
      if (i === 0) {
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
      }

      // Watermarked preview
      const preview = await makePreview(original);
      const previewPath = `${user.id}/${stamp}-${i}.jpg`;
      const { error: previewError } = await supabaseAdmin.storage
        .from('artworks')
        .upload(previewPath, preview, { contentType: 'image/jpeg' });
      if (previewError) {
        console.error(`Preview upload failed for photo #${i + 1}:`, previewError);
        return fail('Could not save the image. Please try again.', 500);
      }
      uploaded.push({ bucket: 'artworks', path: previewPath });
      const previewUrl = supabaseAdmin.storage.from('artworks').getPublicUrl(previewPath).data.publicUrl;

      // Digital art: store each original in the private "originals" bucket and save its path in original_path
      let originalPath: string | null = null;
      if (isDigital) {
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        originalPath = `${user.id}/${stamp}-${i}-${safeName}`;
        const { error: originalError } = await supabaseAdmin.storage
          .from('originals')
          .upload(originalPath, original, { contentType: f.type });
        if (originalError) {
          console.error(`Original upload failed for photo #${i + 1}:`, originalError);
          throw new Error('original upload failed');
        }
        uploaded.push({ bucket: 'originals', path: originalPath });
      }

      processedPhotos.push({ hash, previewUrl, originalPath });
    }

    // 2. Store the first photo on artworks.image_url with shipping fields
    const primary = processedPhotos[0];
    const insertPayload: Record<string, any> = {
      artist_id: user.id,
      title,
      description,
      medium,
      price,
      image_url: primary.previewUrl,
      image_hash: primary.hash,
      is_digital: isDigital,
      is_ai_assisted: isAiAssisted,
      original_path: primary.originalPath,
      shipping_fee: shippingFee,
      ships_from: shipsFrom || null,
    };

    let { data: row, error: insertError } = await supabaseAdmin
      .from('artworks')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError && (insertError.message?.includes('shipping_fee') || insertError.message?.includes('ships_from'))) {
      delete insertPayload.shipping_fee;
      delete insertPayload.ships_from;
      const retry = await supabaseAdmin.from('artworks').insert(insertPayload).select('id').single();
      row = retry.data;
      insertError = retry.error;
    }

    if (insertError || !row) throw insertError ?? new Error('insert failed');

    // 3. Store the others in artwork_images with a position (1, 2, ...)
    if (processedPhotos.length > 1) {
      const secondaryImages = processedPhotos.slice(1).map((photo, idx) => ({
        artwork_id: row.id,
        preview_url: photo.previewUrl,
        original_path: photo.originalPath,
        fingerprint: photo.hash,
        position: idx + 1,
      }));

      const { error: imgErr } = await supabaseAdmin
        .from('artwork_images')
        .insert(secondaryImages);

      if (imgErr) {
        console.error('Error inserting into artwork_images:', imgErr);
      }
    }

    // 4. Save tags in artwork_tags from server
    if (cleanTags.length > 0) {
      const tagRows = cleanTags.map((tag) => ({
        artwork_id: row.id,
        tag,
      }));
      const { error: tagErr } = await supabaseAdmin.from('artwork_tags').insert(tagRows);
      if (tagErr) {
        console.error('Error inserting into artwork_tags:', tagErr);
      }
    }

    return NextResponse.json({ id: row.id });
  } catch (err) {
    console.error('Artwork upload error:', err);
    // Do not leave half-finished files behind.
    for (const u of uploaded) await supabaseAdmin.storage.from(u.bucket).remove([u.path]);
    return fail('Something went wrong while listing your artwork.', 500);
  }
}
