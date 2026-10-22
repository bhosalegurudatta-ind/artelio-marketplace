'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface GeneratedArtwork {
  title: string;
  medium: string;
  curator_note: string;
  color_palette: Array<{ name: string; hex: string }>;
  prompt_recipe: string;
  svg: string;
}

const STYLE_PRESETS = [
  { label: 'Contemporary Abstract', value: 'contemporary abstract, bold color blocking, organic fluid gradients' },
  { label: 'Minimalist Bauhaus', value: 'minimalist bauhaus geometric composition, clean lines, modernist palette' },
  { label: 'Moody Oil & Impasto', value: 'textured expressive oil painting with chiaroscuro lighting and deep impasto' },
  { label: 'Atmospheric Watercolor', value: 'translucent layered watercolor wash with delicate bleeds and soft edges' },
  { label: 'Vibrant Pop / Fauvism', value: 'vibrant modern fauvist art, heightened saturated hues, dynamic expressive brushwork' },
  { label: 'Japanese Woodblock / Ukiyo-e', value: 'modern ukiyo-e woodblock style, serene natural elements, rhythmic contour lines' },
];

const ASPECT_RATIOS = [
  { label: 'Portrait (4:5)', value: 'portrait' },
  { label: 'Square (1:1)', value: 'square' },
  { label: 'Landscape (16:10)', value: 'landscape' },
];

export default function AIArtStudioModal({
  isOpen,
  onClose,
  userRole = 'artist',
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'artist' | 'customer';
}) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(STYLE_PRESETS[0].value);
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [artwork, setArtwork] = useState<GeneratedArtwork | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Please log in first to create artwork with AI Studio.');
      }

      const res = await fetch('/api/ai/generate-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate artwork.');
      }

      setArtwork(data.artwork);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while creating artwork.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadSVG() {
    if (!artwork?.svg) return;
    const blob = new Blob([artwork.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-artelio.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyRecipe() {
    if (!artwork?.prompt_recipe) return;
    navigator.clipboard.writeText(artwork.prompt_recipe);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#121826] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#0B0F19]/80">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold shadow-xs">
              ✦
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">
                AI Artwork Studio
              </h2>
              <p className="text-xs text-white/60">
                {userRole === 'artist'
                  ? 'Co-create new vector artwork pieces, studio palettes, and diffusion prompts'
                  : 'Design custom bespoke commission concepts and aesthetic artwork pieces'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6">
          <div className="grid gap-8 md:grid-cols-12">
            {/* Input Controls */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Artistic Vision / Concept
                  </label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      userRole === 'artist'
                        ? 'e.g. Golden rays piercing through misty emerald forest, serene dawn reflection...'
                        : 'e.g. Peaceful minimalist coastal scene in warm ochre, sand, and cobalt tones for living room...'
                    }
                    className="w-full rounded-2xl border border-white/15 bg-[#151D2C] p-3 text-sm text-white placeholder:text-white/40 focus:border-brand focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                    Artistic Style Preset
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#151D2C] px-3 py-2.5 text-xs font-medium text-white focus:border-brand focus:outline-none"
                  >
                    {STYLE_PRESETS.map((p) => (
                      <option key={p.label} value={p.value} className="bg-[#151D2C] text-white">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.value}
                        type="button"
                        onClick={() => setAspectRatio(ar.value)}
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${
                          aspectRatio === ar.value
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-ink/15 text-ink/70 hover:border-brand/40'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <p className="rounded-xl border border-red-500/20 bg-red-50 p-3 text-xs text-red-700">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand py-3 text-sm font-bold text-white transition-all hover:shadow-art-glow hover:scale-[1.01] disabled:opacity-50 shadow-md"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating Artwork with Gemini AI…</span>
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      <span>Generate Piece &amp; Studio Recipe</span>
                    </>
                  )}
                </button>
              </form>

              <div className="rounded-2xl border border-ink/10 bg-paper/40 p-4 text-xs text-ink/70">
                <p className="font-semibold text-ink">💡 Creator Tip:</p>
                <p className="mt-1">
                  Generates an instantly renderable vector masterwork plus studio-grade palette and prompt recipe for your portfolio or living space.
                </p>
              </div>
            </div>

            {/* Artwork Canvas & Output */}
            <div className="md:col-span-7 flex flex-col items-center justify-center">
              {artwork ? (
                <div className="flex w-full flex-col gap-4">
                  {/* Rendered Artwork Frame */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F19] p-3 shadow-lg">
                    <div
                      className="w-full overflow-hidden rounded-xl bg-[#0B0F19] shadow-inner flex items-center justify-center max-h-[380px]"
                      dangerouslySetInnerHTML={{ __html: artwork.svg }}
                    />
                  </div>

                  {/* Artwork Metadata */}
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-[#161F30] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-white">{artwork.title}</h3>
                        <p className="text-xs font-medium text-brand">{artwork.medium}</p>
                      </div>
                      <button
                        onClick={handleDownloadSVG}
                        className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm shrink-0"
                      >
                        ↓ Download Vector SVG
                      </button>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed italic border-l-2 border-brand/40 pl-3">
                      "{artwork.curator_note}"
                    </p>

                    {/* Color Palette */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40">Studio Palette</span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {artwork.color_palette?.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-xs">
                            <span className="h-3 w-3 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: c.hex }} />
                            <span className="font-semibold text-ink">{c.name}</span>
                            <span className="text-[10px] text-ink/50 font-mono">{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prompt Recipe */}
                    {artwork.prompt_recipe && (
                      <div className="rounded-xl border border-ink/10 bg-paper/60 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Diffusion Master Recipe</span>
                          <button
                            onClick={handleCopyRecipe}
                            className="text-[11px] font-semibold text-brand hover:underline"
                          >
                            {copiedPrompt ? '✓ Copied!' : 'Copy Recipe'}
                          </button>
                        </div>
                        <p className="text-[11px] text-ink/80 leading-relaxed font-mono">
                          {artwork.prompt_recipe}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[340px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center bg-paper/30">
                  <span className="text-4xl mb-3">🎨</span>
                  <h3 className="font-serif text-lg font-bold text-ink">Ready to Co-Create</h3>
                  <p className="mt-1.5 max-w-sm text-xs text-ink/60">
                    Describe your mood, landscape, or color vision on the left. The studio will compose a vector artwork piece, palette, and prompt recipe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
