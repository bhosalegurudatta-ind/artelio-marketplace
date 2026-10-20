import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-only: the Gemini key never reaches the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Models are tried in order. If the first is overloaded (503) or rate limited (429),
// we retry once and then fall back to the next one. Change these in .env.local.
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash',
];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB keeps requests fast and cheap
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PROMPT = `You are helping an independent artist in India list an artwork for sale.
Look at the image and reply with ONLY a JSON object with these keys:
- "title": a short, evocative title (max 6 words)
- "description": 2-3 sentences describing the style, subject, mood and colours, written to appeal to buyers. Do not invent facts you cannot see (size, materials, year).
- "medium": your best guess of the medium, e.g. "Oil on canvas", "Watercolour", "Digital print"
- "price_min": a rough lower price estimate in Indian rupees (integer)
- "price_max": a rough upper price estimate in Indian rupees (integer)
Pricing is a rough guess from the image alone, so keep the range realistic for an emerging artist.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Only logged-in users can spend our AI quota.
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
    }

    // 2. Validate the uploaded image.
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image received.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Please use a JPG, PNG or WebP image.' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image is too large for AI analysis (max 4 MB).' }, { status: 400 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');

    // 3. Ask Gemini to describe the artwork, retrying / falling back if it is busy.
    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: file.type, data: base64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    });

    let res: Response | null = null;
    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': process.env.GEMINI_API_KEY!,
            },
            body: requestBody,
          }
        );
        if (res.ok) break;

        const detail = await res.text();
        console.error(`Gemini error (${model}, attempt ${attempt + 1}):`, res.status, detail);

        // Only busy/rate-limit errors are worth retrying; anything else, move on.
        if (res.status !== 503 && res.status !== 429) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (res?.ok) break;
    }

    if (!res || !res.ok) {
      return NextResponse.json(
        { error: 'The AI assistant is busy right now. Please try again in a minute.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return NextResponse.json({
      title: String(parsed.title ?? ''),
      description: String(parsed.description ?? ''),
      medium: String(parsed.medium ?? ''),
      price_min: Number(parsed.price_min) || null,
      price_max: Number(parsed.price_max) || null,
    });
  } catch (err) {
    console.error('AI listing error:', err);
    return NextResponse.json({ error: 'Could not analyse this image.' }, { status: 500 });
  }
}
