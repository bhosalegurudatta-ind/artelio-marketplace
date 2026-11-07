import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in before promoting an artwork.', 401);

    const body = await req.json().catch(() => ({}));
    const { artworkId, budget: rawBudget, days: rawDays } = body;

    if (!artworkId) return fail('Artwork ID is required.', 400);

    const budget = Number(rawBudget);
    const days = Math.round(Number(rawDays));

    if (isNaN(budget) || budget <= 0) {
      return fail('Please specify a valid promotion budget.', 400);
    }

    if (budget < 49) {
      return fail('Minimum promotion budget is ₹49.', 400);
    }

    if (isNaN(days) || days < 1 || days > 180) {
      return fail('Promotion duration must be between 1 and 180 days.', 400);
    }

    // Verify the artwork exists and belongs to the authenticated artist
    const { data: artwork, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, artist_id')
      .eq('id', artworkId)
      .single();

    if (artErr || !artwork) {
      return fail('Artwork not found.', 404);
    }

    if (artwork.artist_id !== user.id) {
      return fail('You can only promote your own artworks.', 403);
    }

    // Fixed fee: create Razorpay order for the exact budget
    const amountInPaise = Math.round(budget * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `promo_${artwork.id.slice(0, 8)}_${Date.now().toString(36)}`,
      notes: {
        type: 'promoted_listing',
        artwork_id: String(artwork.id),
        artist_id: user.id,
        budget: String(budget),
        days: String(days),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      budget,
      days,
      artworkTitle: artwork.title,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('Promotion order creation error:', err);
    return fail('Could not initialize promotion payment order.', 500);
  }
}
