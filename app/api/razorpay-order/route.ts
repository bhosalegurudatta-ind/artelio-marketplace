import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    // Who is buying comes from their login token, never from the request body.
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in before checking out.', 401);

    const { artworkId } = await req.json();
    if (!artworkId) return fail('Missing artwork.', 400);

    // The price comes from our database, never from the browser.
    const { data: artwork } = await supabaseAdmin
      .from('artworks')
      .select('id, price, sold, is_digital, artist_id')
      .eq('id', artworkId)
      .single();

    if (!artwork) return fail('This artwork could not be found.', 404);
    if (artwork.sold && !artwork.is_digital) return fail('This piece has already been sold.', 409);
    if (artwork.artist_id === user.id) return fail('You cannot buy your own artwork.', 400);

    const order = await razorpay.orders.create({
      amount: Math.round(Number(artwork.price) * 100), // paise
      currency: 'INR',
      receipt: `art_${Date.now()}`,
      notes: { artwork_id: String(artwork.id), customer_id: user.id },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return fail('Could not create payment order', 500);
  }
}
