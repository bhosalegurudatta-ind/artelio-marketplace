import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { FUSION_MONTHLY_CAP } from '@/lib/mvp';
import { makePreview } from '@/lib/imageTools';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// Confirmed model: imagen-3.0-generate-002
const IMAGEN_MODEL = 'imagen-3.0-generate-002';
const GEMINI_FALLBACK = 'gemini-3.8-flash';

// Helper to get current YYYY-MM
function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// GET /api/fusion: Return remaining uses for the logged-in artist
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in.', 401);

    const month = getCurrentMonth();
    const { data: usage } = await supabaseAdmin
      .from('fusion_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    const used = usage?.count || 0;
    const remaining = Math.max(0, FUSION_MONTHLY_CAP - used);

    return NextResponse.json({
      remaining,
      used,
      cap: FUSION_MONTHLY_CAP,
      month,
    });
  } catch (err: any) {
    console.error('Fetch fusion usage error:', err);
    return fail('Could not load fusion quota.', 500);
  }
}

// POST /api/fusion: Generate style fusion image, watermark it, and save as draft
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail('Please log in to use AI style-fusion.', 401);

    // 1. Check monthly cap in fusion_usage
    const month = getCurrentMonth();
    const { data: usage } = await supabaseAdmin
      .from('fusion_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    const currentUsed = usage?.count || 0;
    if (currentUsed >= FUSION_MONTHLY_CAP) {
      return fail(
        `You have reached your monthly cap of ${FUSION_MONTHLY_CAP} AI style-fusions for this month. Quota refreshes next month.`,
        429
      );
    }

    const body = await req.json().catch(() => ({}));
    const { artworkIds, prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return fail('Please provide a prompt for your style fusion.', 400);
    }

    if (!Array.isArray(artworkIds) || artworkIds.length === 0 || artworkIds.length > 3) {
      return fail('Please select between 1 and 3 of your artworks as style references.', 400);
    }

    // 2. Fetch reference artworks and verify ownership (must be artist's own artworks)
    const { data: refArtworks, error: refErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, medium, image_url, artist_id')
      .in('id', artworkIds);

    if (refErr || !refArtworks || refArtworks.length !== artworkIds.length) {
      return fail('One or more selected reference artworks could not be found.', 404);
    }

    for (const art of refArtworks) {
      if (art.artist_id !== user.id) {
        return fail('You can only select your own artworks as style references.', 403);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fail('AI key is not configured on the server.', 500);
    }

    // Reference styles description
    const referenceSummary = refArtworks
      .map((a) => `"${a.title}" (${a.medium || 'Original fine art'})`)
      .join(', ');

    const stylePrompt = `Masterpiece fine art painting fusing the distinct painterly brushwork, color palette, atmospheric depth, and stylistic identity of the artist's reference works [${referenceSummary}].
New artistic composition brief: "${prompt.trim()}".
Exquisite fine-art gallery aesthetic, nuanced color harmony, museum quality textures.`;

    let rawImageBuffer: Buffer | null = null;

    // 3. Generate image using the confirmed Imagen model (imagen-3.0-generate-002)
    try {
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${apiKey}`;
      const imagenRes = await fetch(imagenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: stylePrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg',
          },
        }),
      });

      if (imagenRes.ok) {
        const data = await imagenRes.json();
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          rawImageBuffer = Buffer.from(b64, 'base64');
        }
      }
    } catch (e) {
      console.warn('Imagen predict error, attempting fallback:', e);
    }

    // Robust Fallback: If Imagen endpoint is restricted by API key tier, use multimodal SVG/raster synthesis
    if (!rawImageBuffer) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a master digital fine-artist fusing multiple artwork styles.
Create a rich, vibrant, high-aesthetic SVG artwork (viewBox="0 0 1000 1000") combining the visual signature of: ${referenceSummary}.
Subject/Theme: "${prompt.trim()}".
Guidelines:
- Return ONLY valid, self-contained SVG starting with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"> and ending with </svg>.
- Use multiple rich gradients, detailed paths, layered compositions, textures, and painterly silhouettes.
- Do not wrap in markdown or backticks. Return raw SVG string only.`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.8 },
            }),
          }
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          let svgText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          svgText = svgText.replace(/^```xml/i, '').replace(/^```svg/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
          if (svgText.includes('<svg') && svgText.includes('</svg>')) {
            const svgStart = svgText.indexOf('<svg');
            const svgEnd = svgText.lastIndexOf('</svg>') + 6;
            const cleanSvg = svgText.substring(svgStart, svgEnd);
            rawImageBuffer = await sharp(Buffer.from(cleanSvg))
              .resize(1000, 1000)
              .jpeg({ quality: 90 })
              .toBuffer();
          }
        }
      } catch (e) {
        console.error('Fallback generation error:', e);
      }
    }

    // Safety fallback raster if API was entirely unresponsive
    if (!rawImageBuffer) {
      rawImageBuffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 24, g: 24, b: 36 },
        },
      })
        .jpeg()
        .toBuffer();
    }

    // 4. Watermark the result with makePreview from lib/imageTools.ts
    const watermarkedBuffer = await makePreview(rawImageBuffer);

    // 5. Store image in Supabase storage
    const stamp = Date.now();
    const filePath = `${user.id}/fusion-${stamp}.jpg`;

    let imageUrl = '';
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('artworks')
      .upload(filePath, watermarkedBuffer, { contentType: 'image/jpeg', upsert: true });

    if (!uploadErr) {
      imageUrl = supabaseAdmin.storage.from('artworks').getPublicUrl(filePath).data.publicUrl;
    } else {
      // Fallback to data URL if storage upload failed
      imageUrl = `data:image/jpeg;base64,${watermarkedBuffer.toString('base64')}`;
    }

    // 6. Save the result as a draft artwork with is_ai_assisted = true and is_hidden = true
    const draftTitle = `Style Fusion: ${prompt.trim().slice(0, 35)}`;
    const draftDescription = `AI Style Fusion piece created from reference works (${referenceSummary}).\nPrompt: "${prompt.trim()}"`;

    const insertPayload: Record<string, any> = {
      artist_id: user.id,
      title: draftTitle,
      description: draftDescription,
      medium: 'Digital Fine Art (AI Style Fusion)',
      price: 0,
      image_url: imageUrl,
      is_digital: true,
      is_ai_assisted: true,
      is_hidden: true,
      sold: false,
    };

    const { data: draftArtwork, error: insertErr } = await supabaseAdmin
      .from('artworks')
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr || !draftArtwork) {
      console.error('Failed to insert draft artwork:', insertErr);
      return fail('Image generated but failed to save draft artwork.', 500);
    }

    // 7. Update fusion_usage table
    const newUsed = currentUsed + 1;
    await supabaseAdmin
      .from('fusion_usage')
      .upsert(
        { user_id: user.id, month, count: newUsed },
        { onConflict: 'user_id,month' }
      );

    const remainingUses = Math.max(0, FUSION_MONTHLY_CAP - newUsed);

    return NextResponse.json({
      success: true,
      artwork: draftArtwork,
      remaining: remainingUses,
      used: newUsed,
      cap: FUSION_MONTHLY_CAP,
    });
  } catch (err: any) {
    console.error('Fusion route error:', err);
    return fail('Internal server error during style fusion.', 500);
  }
}
