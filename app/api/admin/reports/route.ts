import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/reports: lists reports with artwork title, reason, details, status
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        reason,
        details,
        status,
        created_at,
        reporter_id,
        artwork_id,
        artworks (
          id,
          title,
          image_url,
          price,
          is_hidden,
          artist_id,
          users (
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reports: reports ?? [],
    });
  } catch (err: any) {
    console.error('Admin reports GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/reports: set status to 'resolved' or 'dismissed'
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { reportId, status } = await req.json();

    if (!reportId || !['resolved', 'dismissed', 'open'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid reportId and status (resolved or dismissed) are required.' },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select('id, status')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (err: any) {
    console.error('Admin reports POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
