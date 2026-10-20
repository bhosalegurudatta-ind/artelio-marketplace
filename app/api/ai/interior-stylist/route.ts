import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT_TEMPLATE = `You are an elite interior architect and luxury art stylist.
Examine this photo of a room/interior wall meticulously.

Analyze the room's:
1. Interior design aesthetic (e.g., Japandi, Scandinavian Minimalist, Mid-Century Modern, Industrial, Warm Bohemian, Classical Baroque, etc.)
2. Dominant and accent color palette (walls, furniture, flooring, natural lighting)
3. Room mood & vibe (calm, energetic, moody, organic, vibrant)
4. Key styling recommendation for artwork (ideal size, frame style, canvas orientation, color contrast)

We also have a collection of available original artworks in our gallery catalog:
{{ARTWORKS_CATALOG}}

Evaluate the artworks and select the top 3-4 best matching pieces that would look breathtaking in this specific space.
For each selected artwork, specify a match score (0-100) and an interior designer's rationale explaining WHY it complements the wall color, lighting, and furniture.

Return ONLY a valid JSON object strictly matching this schema:
{
  "room_analysis": {
    "aesthetic": "e.g. Warm Contemporary Japandi",
    "dominant_tones": ["#E8D8C8", "#3E3835", "#8C927A"],
    "lighting_vibe": "Soft diffuse daylight with warm oak undertones",
    "recommended_art_style": "Minimalist abstraction or organic earthy textures",
    "recommended_frame": "Raw natural oak or slim matte black floating frame"
  },
  "recommended_artworks": [
    {
      "artwork_id": "UUID from the catalog",
      "match_score": 96,
      "designer_rationale": "The ochre and deep indigo in this piece creates a captivating focal contrast against the neutral beige plaster wall..."
    }
  ],
  "curator_note": "A summary note from the interior stylist describing how to elevate the entire ambiance of this room."
}
Return pure JSON with no markdown formatting outside the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('roomImage') as File | null;
    const roomImageUrl = formData.get('roomImageUrl') as string | null;

    let base64Data: string;
    let mimeType: string;

    if (file && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Room photo too large. Max 6MB allowed.' }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file format. JPG, PNG, WebP supported.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      base64Data = buffer.toString('base64');
      mimeType = file.type;
    } else if (roomImageUrl) {
      const response = await fetch(roomImageUrl);
      if (!response.ok) {
        return NextResponse.json({ error: 'Could not fetch image from URL.' }, { status: 400 });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image at URL exceeds 6MB.' }, { status: 400 });
      }
      base64Data = buffer.toString('base64');
      mimeType = response.headers.get('content-type') || 'image/jpeg';
    } else {
      return NextResponse.json({ error: 'Please upload a photo of your room or wall.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    // Fetch active unsold artworks from catalog to match against
    const { data: artworks, error: artErr } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, medium, description, image_url, users(name)')
      .eq('sold', false)
      .limit(30);

    if (artErr || !artworks || artworks.length === 0) {
      return NextResponse.json({ error: 'No artworks currently available in catalog.' }, { status: 404 });
    }

    const catalogSummary = artworks.map((a: any) => ({
      id: a.id,
      title: a.title,
      price: a.price,
      medium: a.medium,
      description: a.description ? a.description.substring(0, 150) : '',
      artist: a.users?.name || 'Independent Artist',
    }));

    const customizedPrompt = PROMPT_TEMPLATE.replace(
      '{{ARTWORKS_CATALOG}}',
      JSON.stringify(catalogSummary, null, 2)
    );

    const payload = {
      contents: [
        {
          parts: [
            { text: customizedPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    };

    let responseText = '';
    let success = false;
    let lastError = '';

    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second max timeout per attempt

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text();
          lastError = `${model} returned ${res.status}: ${errBody}`;
          console.warn(`Model ${model} unavailable (${res.status}), trying next model...`);
          continue;
        }

        const data = await res.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (responseText) {
          success = true;
          break;
        }
      } catch (err: any) {
        lastError = err.message || 'Connection error';
        console.warn(`Model ${model} request error (${lastError}), falling back...`);
      }
    }

    if (!success || !responseText) {
      return NextResponse.json({ error: 'Stylist analysis unavailable right now.', details: lastError }, { status: 502 });
    }

    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleanJson);

    // Merge full artwork details into recommendations
    const enrichedRecommendations = (result.recommended_artworks || []).map((rec: any) => {
      const art = artworks.find((a: any) => a.id === rec.artwork_id);
      return {
        ...rec,
        artwork: art
          ? {
              id: art.id,
              title: art.title,
              price: art.price,
              medium: art.medium,
              imageUrl: art.image_url,
              artist: (art as any).users?.name || 'Independent Artist',
            }
          : null,
      };
    }).filter((r: any) => r.artwork !== null);

    return NextResponse.json({
      success: true,
      room_analysis: result.room_analysis,
      curator_note: result.curator_note,
      recommendations: enrichedRecommendations,
    });
  } catch (error: any) {
    console.error('Interior Stylist route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
