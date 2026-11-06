import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB limit
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// GET /api/shop - Get logged-in artist's own shop profile
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, shop_name, banner_url, about, shipping_policy, return_policy, bio')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return fail('Artist profile not found.', 404);
    }

    return NextResponse.json({
      success: true,
      shop: profile,
    });
  } catch (err: any) {
    console.error('GET /api/shop error:', err);
    return fail('Failed to fetch shop profile.', 500);
  }
}

// PATCH /api/shop - Updates only the logged-in artist's own row
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const contentType = req.headers.get('content-type') || '';
    const updates: Record<string, any> = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const shopName = form.get('shop_name');
      const about = form.get('about');
      const shippingPolicy = form.get('shipping_policy');
      const returnPolicy = form.get('return_policy');
      const bannerFile = form.get('banner');

      if (shopName !== null) updates.shop_name = String(shopName).trim();
      if (about !== null) updates.about = String(about).trim();
      if (shippingPolicy !== null) updates.shipping_policy = String(shippingPolicy).trim();
      if (returnPolicy !== null) updates.return_policy = String(returnPolicy).trim();

      // Handle banner image upload with same checks as artwork images
      if (bannerFile instanceof File && bannerFile.size > 0) {
        if (!TYPES.includes(bannerFile.type)) {
          return fail('Banner must be a JPG, PNG or WebP image.', 400);
        }
        if (bannerFile.size > MAX_BYTES) {
          return fail('Banner image is too large (max 4 MB).', 400);
        }

        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        const stamp = Date.now();
        const ext = bannerFile.type === 'image/png' ? 'png' : bannerFile.type === 'image/webp' ? 'webp' : 'jpg';
        const bannerPath = `banners/${user.id}/${stamp}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
          .from('artworks')
          .upload(bannerPath, buffer, {
            contentType: bannerFile.type,
            upsert: true,
          });

        if (uploadErr) {
          console.error('Banner upload error:', uploadErr);
          return fail('Could not upload banner image. Please try again.', 500);
        }

        const bannerUrl = supabaseAdmin.storage.from('artworks').getPublicUrl(bannerPath).data.publicUrl;
        updates.banner_url = bannerUrl;
      }
    } else {
      // JSON body
      const body = await req.json().catch(() => ({}));
      if (body.shop_name !== undefined) updates.shop_name = String(body.shop_name).trim();
      if (body.banner_url !== undefined) updates.banner_url = body.banner_url ? String(body.banner_url).trim() : null;
      if (body.about !== undefined) updates.about = String(body.about).trim();
      if (body.shipping_policy !== undefined) updates.shipping_policy = String(body.shipping_policy).trim();
      if (body.return_policy !== undefined) updates.return_policy = String(body.return_policy).trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes submitted.' });
    }

    // Safety: Update strictly the logged-in artist's own row
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, name, shop_name, banner_url, about, shipping_policy, return_policy')
      .single();

    if (updateErr) {
      console.error('PATCH /api/shop db error:', updateErr);
      return fail('Failed to update shop settings.', 500);
    }

    return NextResponse.json({
      success: true,
      shop: updated,
    });
  } catch (err: any) {
    console.error('PATCH /api/shop error:', err);
    return fail('Internal server error updating shop.', 500);
  }
}
