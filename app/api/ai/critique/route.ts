import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { hasListingAccess } from '@/lib/mvp';

export const runtime = 'nodejs';

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `You are a world-class art critic, master colourist, and gallery curator.
Examine this artwork meticulously and return ONLY a valid JSON object with the following structure:
{
  "palette": [
    {
      "hex": "#XXXXXX",
      "name": "Evocative color name",
      "role": "Dominant" | "Secondary" | "Accent" | "Undertone",
      "mood": "Brief description of psychological impact"
    }
  ],
  "composition": {
    "harmony_score": 88,
    "focal_point": "Detailed analysis of where the viewer's eye lands first and visual path",
    "balance_and_weight": "Analysis of symmetry, rule of thirds, or dynamic visual tension",
    "lighting_and_contrast": "Evaluation of chiaroscuro, tonal range, and atmospheric light",
    "brushwork_and_depth": "Texture, impasto/glaze/layering illusion, and depth perspective"
  },
  "critique": {
    "key_strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "enhancement_suggestions": ["Actionable refinement 1", "Actionable refinement 2"],
    "curator_presentation_tip": "Recommended frame, mounting, mat board color, or ideal display lighting"
  },
  "storyteller_statement": "A poetic, gallery-grade exhibition statement (2-3 sentences) articulating the emotional resonance, philosophical depth, and visual narrative for prospective collectors."
}
Return at least 5 distinct colors in the palette with valid 6-character hex codes. Ensure all JSON fields are populated.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify User Authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    // 2. Verify Artist Role and Premium / Trial Access
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, approved, trial_ends_at, paid_until')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'artist') {
      return NextResponse.json({ error: 'This tool is exclusively available for artists.' }, { status: 403 });
    }

    if (!profile.approved) {
      return NextResponse.json({ error: 'Your artist application is pending approval.' }, { status: 403 });
    }

    // Gated to active trial or paid subscription
    if (!hasListingAccess(profile)) {
      return NextResponse.json(
        { error: 'Creator Pro access expired. Please renew your artist plan to access the AI Critique Studio.' },
        { status: 403 }
      );
    }

    // 3. Process the Image: from upload File or artwork URL
    const form = await req.formData();
    const file = form.get('image');
    const artworkId = form.get('artworkId');

    let mimeType = 'image/jpeg';
    let base64Image = '';

    if (file instanceof File) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image is too large (max 5 MB).' }, { status: 400 });
      }
      mimeType = file.type;
      base64Image = Buffer.from(await file.arrayBuffer()).toString('base64');
    } else if (artworkId) {
      const { data: artwork } = await supabaseAdmin
        .from('artworks')
        .select('image_url, artist_id')
        .eq('id', String(artworkId))
        .single();

      if (!artwork || !artwork.image_url) {
        return NextResponse.json({ error: 'Artwork not found or has no image.' }, { status: 404 });
      }

      // Fetch the artwork preview image bytes
      const imgRes = await fetch(artwork.image_url);
      if (!imgRes.ok) {
        return NextResponse.json({ error: 'Could not retrieve artwork image.' }, { status: 500 });
      }
      const arrayBuf = await imgRes.arrayBuffer();
      mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      base64Image = Buffer.from(arrayBuf).toString('base64');
    } else {
      return NextResponse.json({ error: 'Please provide an image or artworkId.' }, { status: 400 });
    }

    // 4. Request Analysis from Google Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-key') {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    let res: Response | null = null;
    let lastError = '';

    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: requestBody,
          }
        );

        if (res.ok) break;

        lastError = await res.text();
        console.error(`Gemini critique error (${model}, attempt ${attempt + 1}):`, res.status, lastError);

        if (res.status !== 503 && res.status !== 429) break;
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (res?.ok) break;
    }

    if (!res || !res.ok) {
      return NextResponse.json(
        { error: 'The AI Critique Studio is momentarily busy. Please try again shortly.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    console.error('Critique API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during analysis.' },
      { status: 500 }
    );
  }
}
