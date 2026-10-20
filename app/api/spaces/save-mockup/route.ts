import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to save spaces to your gallery.' }, { status: 401 });
    }

    const { artworkId, snapshotBase64, title, roomStyle, harmonyScore, isPublic } = await req.json();

    if (!snapshotBase64) {
      return NextResponse.json({ error: 'No room snapshot image received.' }, { status: 400 });
    }

    // Decode base64 image
    const base64Data = snapshotBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `mockups/${user.id}/${Date.now()}.jpg`;

    // Upload to public artworks bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('artworks')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Mockup upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload mockup image.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('artworks').getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;

    // Insert into room_mockups table
    const { data: row, error: dbError } = await supabaseAdmin
      .from('room_mockups')
      .insert({
        user_id: user.id,
        artwork_id: artworkId || null,
        image_url: imageUrl,
        title: title || 'My Styled Space',
        room_style: roomStyle || null,
        harmony_score: typeof harmonyScore === 'number' ? harmonyScore : null,
        is_public: isPublic !== false,
      })
      .select('id, image_url, title, room_style, harmony_score, created_at')
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // If table doesn't exist yet, still return the uploaded image url
      return NextResponse.json({
        success: true,
        imageUrl,
        warning: 'Saved image, but please ensure supabase-spaces.sql has been run in Supabase SQL editor.',
      });
    }

    return NextResponse.json({
      success: true,
      mockup: row,
    });
  } catch (err: any) {
    console.error('Save mockup route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
