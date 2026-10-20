import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

interface CreateArtRequest {
  prompt: string;
  style?: string; // e.g. "minimalist", "abstract", "geometric", "oil-painting", "watercolor"
  aspectRatio?: string; // "portrait" | "square" | "landscape"
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to use AI Artwork Studio.' }, { status: 401 });
    }

    const body: CreateArtRequest = await req.json();
    const prompt = (body.prompt || '').trim();
    const style = (body.style || 'contemporary abstract').trim();
    const aspectRatio = body.aspectRatio || 'portrait';

    if (!prompt) {
      return NextResponse.json({ error: 'Please describe the artwork you want to create.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI key not configured on server.' }, { status: 500 });
    }

    const viewBox = aspectRatio === 'square' ? '0 0 800 800' : aspectRatio === 'landscape' ? '0 0 1000 650' : '0 0 800 1000';

    const systemPrompt = `You are a visionary contemporary generative artist, master fine-art colorist, and gallery director.
Given the user's artistic brief, you must generate a complete, high-aesthetic, ready-to-render SVG artwork piece along with curatorial metadata.

Brief: "${prompt}"
Requested Style: "${style}"
Aspect Ratio: "${aspectRatio}" (viewBox="${viewBox}")

Guidelines for the SVG:
- Output vibrant, modern aesthetic artwork suitable for display in high-end galleries and minimalist interiors.
- Utilize creative SVG features: rich multi-stop <linearGradient> and <radialGradient> with vivid opacity blending, geometric and organic <path>, <circle>, <polygon>, <g> groupings, layered silhouettes, and textured visual balance.
- Dimensions must match the requested viewBox (${viewBox}).
- Include xmlns="http://www.w3.org/2000/svg".
- The SVG MUST be self-contained and render cleanly on any background.

Return ONLY a valid JSON object with EXACTLY this structure:
{
  "title": "Evocative, poetic artwork title (e.g., 'Ethereal Solitude III')",
  "medium": "Recommended medium if physically painted (e.g. 'Acrylic & Metallic Leaf on Canvas' or 'Fine Art Giclée Print')",
  "curator_note": "A 2-3 sentence gallery statement explaining the mood, symbolism, and atmosphere of the piece.",
  "color_palette": [
    {"name": "Color Name", "hex": "#XXXXXX"},
    {"name": "Color Name", "hex": "#XXXXXX"},
    {"name": "Color Name", "hex": "#XXXXXX"},
    {"name": "Color Name", "hex": "#XXXXXX"}
  ],
  "prompt_recipe": "Detailed text prompt optimized for diffusion models like Midjourney, Flux, or Stable Diffusion if the artist wishes to render higher-fidelity photorealistic raster versions.",
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"${viewBox}\\" ...>...</svg>"
}

Ensure the "svg" field has properly escaped quotes so the entire response is 100% valid JSON. Do not include markdown ticks around the JSON.`;

    let lastError = '';
    for (const model of GEMINI_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          lastError = `Model ${model} returned ${res.status}: ${errText}`;
          continue;
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastError = `Empty response from ${model}`;
          continue;
        }

        // Clean any accidental markdown backticks
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          success: true,
          model,
          artwork: parsed,
        });
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    return NextResponse.json(
      { error: `Could not generate artwork. ${lastError}` },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
