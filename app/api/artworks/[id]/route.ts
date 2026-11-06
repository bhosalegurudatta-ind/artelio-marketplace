import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// GET /api/artworks/[id]
// Returns artwork details for editing and order status flags
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Authentication required.', 401);

    const artworkId = params.id;
    if (!artworkId) return fail('Artwork ID is required.', 400);

    const { data: artwork, error } = await supabaseAdmin
      .from('artworks')
      .select('id, title, description, medium, price, image_url, sold, is_digital, is_ai_assisted, artist_id, created_at')
      .eq('id', artworkId)
      .single();

    if (error || !artwork) {
      return fail('Artwork not found.', 404);
    }

    // Check ownership
    if (artwork.artist_id !== user.id) {
      return fail('You can only view edit details for your own artwork.', 403);
    }

    // Check if artwork has any orders with status paid, shipped, or disputed (blocks price changes)
    const { data: blockingOrders } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('artwork_id', artworkId)
      .in('status', ['paid', 'shipped', 'disputed'])
      .limit(1);

    // Check if artwork has ANY order (blocks deletion)
    const { count: totalOrdersCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('artwork_id', artworkId);

    // Fetch existing tags
    const { data: tagRows } = await supabaseAdmin
      .from('artwork_tags')
      .select('tag')
      .eq('artwork_id', artworkId);

    const tags = (tagRows ?? []).map((t: any) => t.tag);

    const hasBlockingOrder = Boolean(blockingOrders && blockingOrders.length > 0);
    const hasAnyOrder = Boolean(totalOrdersCount && totalOrdersCount > 0);

    return NextResponse.json({
      success: true,
      artwork,
      tags,
      canEditPrice: !hasBlockingOrder,
      blockingOrderStatus: hasBlockingOrder ? blockingOrders![0].status : null,
      hasOrders: hasAnyOrder,
    });
  } catch (err: any) {
    console.error('GET /api/artworks/[id] error:', err);
    return fail('Failed to fetch artwork details.', 500);
  }
}

// PATCH /api/artworks/[id]
// Updates title, description, medium, price with server-side ownership & price lock verification
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in first.', 401);

    const artworkId = params.id;
    if (!artworkId) return fail('Artwork ID is required.', 400);

    // 1. Fetch artwork and check ownership
    const { data: artwork, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, description, medium, price, artist_id')
      .eq('id', artworkId)
      .single();

    if (artErr || !artwork) {
      return fail('Artwork not found.', 404);
    }

    if (artwork.artist_id !== user.id) {
      return fail('Forbidden: You can only edit your own artworks.', 403);
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, medium, price, tags } = body;

    const updates: Record<string, any> = {};

    // Validate title if provided
    if (title !== undefined) {
      const cleanTitle = String(title).trim();
      if (!cleanTitle || cleanTitle.length > 120) {
        return fail('Please provide a title between 1 and 120 characters.', 400);
      }
      updates.title = cleanTitle;
    }

    // Validate description if provided
    if (description !== undefined) {
      updates.description = String(description).trim();
    }

    // Validate medium if provided
    if (medium !== undefined) {
      const cleanMedium = String(medium).trim();
      if (!cleanMedium) {
        return fail('Please specify the medium (e.g., Oil on Canvas, Digital, Charcoal).', 400);
      }
      updates.medium = cleanMedium;
    }

    // Validate price if provided
    if (price !== undefined) {
      const numPrice = Number(price);
      if (!Number.isFinite(numPrice) || numPrice < 1 || numPrice > 10000000) {
        return fail('Price must be between ₹1 and ₹1,00,00,000.', 400);
      }

      // Check if price is actually changing
      if (Math.round(numPrice) !== Math.round(Number(artwork.price))) {
        // Step 3: Block price changes if the artwork has an order with status paid, shipped or disputed
        const { data: activeOrders, error: orderErr } = await supabaseAdmin
          .from('orders')
          .select('id, status')
          .eq('artwork_id', artworkId)
          .in('status', ['paid', 'shipped', 'disputed'])
          .limit(1);

        if (orderErr) {
          console.error('Error checking active orders for price update:', orderErr);
          return fail('Could not verify existing order status.', 500);
        }

        if (activeOrders && activeOrders.length > 0) {
          return fail(
            `Cannot change price: This artwork has an active order with status "${activeOrders[0].status}". Price cannot be changed once an order is placed.`,
            400
          );
        }

        updates.price = Math.round(numPrice);
      }
    }

    // Handle tags update if provided: up to 13 tags, lowercase, trimmed, no duplicates, max 20 chars
    let savedTags: string[] | undefined = undefined;
    if (tags !== undefined) {
      let rawTags: string[] = [];
      if (Array.isArray(tags)) rawTags = tags.map(String);
      else if (typeof tags === 'string') rawTags = tags.split(',');

      const cleanTags = Array.from(
        new Set(
          rawTags
            .map((t) => t.toLowerCase().trim().slice(0, 20))
            .filter((t) => t.length > 0)
        )
      ).slice(0, 13);

      // Save tags in artwork_tags (remove old, insert new)
      await supabaseAdmin.from('artwork_tags').delete().eq('artwork_id', artworkId);

      if (cleanTags.length > 0) {
        const tagRows = cleanTags.map((tag) => ({
          artwork_id: artworkId,
          tag,
        }));
        const { error: tagInsertErr } = await supabaseAdmin.from('artwork_tags').insert(tagRows);
        if (tagInsertErr) console.error('Error updating artwork_tags:', tagInsertErr);
      }
      savedTags = cleanTags;
    }

    if (Object.keys(updates).length === 0 && tags === undefined) {
      return NextResponse.json({ success: true, artwork, message: 'No changes submitted.' });
    }

    let updated: any = artwork;
    if (Object.keys(updates).length > 0) {
      const { data: u, error: updateErr } = await supabaseAdmin
        .from('artworks')
        .update(updates)
        .eq('id', artworkId)
        .select('id, title, description, medium, price, artist_id')
        .single();

      if (updateErr) {
        console.error('Error updating artwork:', updateErr);
        return fail('Failed to update artwork in database.', 500);
      }
      updated = u;
    }

    return NextResponse.json({
      success: true,
      artwork: updated,
      tags: savedTags,
    });
  } catch (err: any) {
    console.error('PATCH /api/artworks/[id] error:', err);
    return fail('Something went wrong updating the artwork.', 500);
  }
}

// DELETE /api/artworks/[id]
// Block deleting an artwork that has any order
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in first.', 401);

    const artworkId = params.id;
    if (!artworkId) return fail('Artwork ID is required.', 400);

    // 1. Fetch artwork and check ownership
    const { data: artwork, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, artist_id')
      .eq('id', artworkId)
      .single();

    if (artErr || !artwork) {
      return fail('Artwork not found.', 404);
    }

    if (artwork.artist_id !== user.id) {
      return fail('Forbidden: You can only remove your own artworks.', 403);
    }

    // 2. Block deleting an artwork that has any order
    const { count: orderCount, error: countErr } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('artwork_id', artworkId);

    if (countErr) {
      console.error('Error checking order count for artwork deletion:', countErr);
      return fail('Failed to check order history.', 500);
    }

    if (orderCount && orderCount > 0) {
      return fail(
        `Cannot remove "${artwork.title}": This artwork has ${orderCount} order(s) attached in the system. Artworks with order history cannot be deleted.`,
        400
      );
    }

    // 3. Safe to delete
    const { error: deleteErr } = await supabaseAdmin
      .from('artworks')
      .delete()
      .eq('id', artworkId);

    if (deleteErr) {
      console.error('Artwork deletion error:', deleteErr);
      return fail('Failed to delete artwork.', 500);
    }

    return NextResponse.json({
      success: true,
      message: `Artwork "${artwork.title}" has been successfully removed.`,
    });
  } catch (err: any) {
    console.error('DELETE /api/artworks/[id] error:', err);
    return fail('Internal server error deleting artwork.', 500);
  }
}
