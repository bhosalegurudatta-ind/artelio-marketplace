import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';

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

const PROMPT = `You are a high-end interior designer, architectural lighting consultant, and art curator.
You are given two images:
Image 1: A photo of the buyer's room / wall space.
Image 2: An original artwork the buyer is considering purchasing.

Analyze how this artwork interacts with the room's interior architecture and return ONLY a valid JSON object with the following structure:
{
  "room_style": "Detected interior style (e.g. Modern Japandi, Industrial Loft, Warm Contemporary)",
  "harmony_score": 92,
  "wall_color_analysis": "How the artwork's palette complements or contrasts with the wall paint and surrounding furnishings",
  "lighting_evaluation": "Assessment of ambient natural light vs artificial lighting on the wall",
  "placement_recommendation": "Exact hanging advice (e.g. Center at 58 inches eye-level above sofa, with 8-10 inches clearance)",
  "scale_and_proportion": "Advice on whether this artwork size balances the wall space or needs a mat/multi-piece arrangement",
  "ideal_frame_style": "Recommended framing (e.g. Matte black floating frame, Natural white oak, or Gallery wrap)",
  "designer_verdict": "An inspiring, 2-sentence summary of why this piece elevates the living space"
}
Ensure all keys are populated and return strictly valid JSON.`;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify User Authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to preview artwork in your room.' }, { status: 401 });
    }

    // 2. Verify Buyer / User Subscription or Trial Access
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, trial_ends_at, paid_until')
      .eq('id', user.id)
      .single();

    const now = Date.now();
    const isPaid = profile?.paid_until && new Date(profile.paid_until).getTime() > now;
    const isTrial = profile?.trial_ends_at && new Date(profile.trial_ends_at).getTime() > now;
    const isSubscribed = Boolean(isPaid || isTrial);

    // 3. Process Form Data
    const form = await req.formData();
    const roomFile = form.get('roomImage');
    const artworkId = form.get('artworkId');

    if (!(roomFile instanceof File)) {
      return NextResponse.json({ error: 'Please upload a photo of your room or wall.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(roomFile.type)) {
      return NextResponse.json({ error: 'Please upload a JPG, PNG, or WebP photo.' }, { status: 400 });
    }
    if (roomFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Room photo is too large (max 5 MB).' }, { status: 400 });
    }
    if (!artworkId) {
      return NextResponse.json({ error: 'Missing artwork identifier.' }, { status: 400 });
    }

    // 4. Retrieve the Artwork
    const { data: artwork } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, medium, image_url')
      .eq('id', String(artworkId))
      .single();

    if (!artwork || !artwork.image_url) {
      return NextResponse.json({ error: 'Artwork not found or has no preview image.' }, { status: 404 });
    }

    // Read room photo bytes
    const roomBase64 = Buffer.from(await roomFile.arrayBuffer()).toString('base64');

    // Fetch artwork image bytes
    const artRes = await fetch(artwork.image_url);
    if (!artRes.ok) {
      return NextResponse.json({ error: 'Could not load artwork image for analysis.' }, { status: 500 });
    }
    const artMime = artRes.headers.get('content-type') || 'image/jpeg';
    const artBase64 = Buffer.from(await artRes.arrayBuffer()).toString('base64');

    // 5. Query Gemini Vision with both images
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-key') {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: roomFile.type, data: roomBase64 } },
            { inline_data: { mime_type: artMime, data: artBase64 } },
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
        console.error(`Gemini room visualizer error (${model}, attempt ${attempt + 1}):`, res.status, lastError);

        if (res.status !== 503 && res.status !== 429) break;
        await new Promise((r) => setTimeout(r, 1200));
      }
      if (res?.ok) break;
    }

    if (!res || !res.ok) {
      return NextResponse.json(
        { error: 'The AI Room Visualizer is temporarily busy. Please try again shortly.' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleanJson = rawText.replace(/```json|```/g, '').trim();
    const stylingAdvice = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      isSubscribed,
      stylingAdvice,
      artwork: {
        id: artwork.id,
        title: artwork.title,
        imageUrl: artwork.image_url,
      },
    });
  } catch (err: any) {
    console.error('Room visualizer API error:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during room visualization.' },
      { status: 500 }
    );
  }
}
