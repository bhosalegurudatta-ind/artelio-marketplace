import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

// Anyone logged in can report a listing that looks copied or breaks the rules.
// Founders review reports in the Supabase table editor and take listings down if needed.
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in to report a listing.', 401);

    const { artworkId, reason, details } = await req.json();
    if (!artworkId) return fail('Missing artwork.', 400);
    const text = String(reason ?? '').trim();
    if (!text) return fail('Please choose a reason.', 400);

    const { error } = await supabaseAdmin.from('reports').insert({
      artwork_id: artworkId,
      reporter_id: user.id,
      reason: text.slice(0, 100),
      details: String(details ?? '').trim().slice(0, 1000) || null,
    });
    if (error) return fail('Could not send your report. Please try again.', 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Report error:', err);
    return fail('Something went wrong.', 500);
  }
}
