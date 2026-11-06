import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { sendNewListingReportAdminEmail } from '@/lib/email';

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

    // Notify admin about the new listing report asynchronously
    try {
      const { data: art } = await supabaseAdmin
        .from('artworks')
        .select('title')
        .eq('id', artworkId)
        .maybeSingle();

      sendNewListingReportAdminEmail({
        artworkId,
        artworkTitle: art?.title || null,
        reporterEmail: user.email,
        reason: text,
        details: String(details ?? '').trim() || null,
      }).catch((emailErr) => console.error('[Reports] Admin report notification error:', emailErr));
    } catch (e) {
      console.error('[Reports] Failed preparing admin report notification:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Report error:', err);
    return fail('Something went wrong.', 500);
  }
}
