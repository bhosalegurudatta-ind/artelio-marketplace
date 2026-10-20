'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type CritiqueAnalysis = {
  palette: Array<{
    hex: string;
    name: string;
    role: string;
    mood: string;
  }>;
  composition: {
    harmony_score: number;
    focal_point: string;
    balance_and_weight: string;
    lighting_and_contrast: string;
    brushwork_and_depth: string;
  };
  critique: {
    key_strengths: string[];
    enhancement_suggestions: string[];
    curator_presentation_tip: string;
  };
  storyteller_statement: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultArtworkId?: string | null;
  defaultTitle?: string | null;
  defaultImageUrl?: string | null;
  isPremium: boolean;
};

export default function ArtCritiqueModal({
  isOpen,
  onClose,
  defaultArtworkId,
  defaultTitle,
  defaultImageUrl,
  isPremium,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImageUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CritiqueAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedStatement, setCopiedStatement] = useState(false);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysis(null);
    setErrorMsg('');
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function runCritique() {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Please log in first.');
        setLoading(false);
        return;
      }

      const form = new FormData();
      if (file) {
        form.append('image', file);
      } else if (defaultArtworkId) {
        form.append('artworkId', defaultArtworkId);
      } else {
        setErrorMsg('Please choose an image or select an artwork.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to complete analysis.');
        setLoading(false);
        return;
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, type: 'hex' | 'statement', hexVal?: string) {
    navigator.clipboard.writeText(text);
    if (type === 'hex' && hexVal) {
      setCopiedHex(hexVal);
      setTimeout(() => setCopiedHex(null), 2000);
    } else {
      setCopiedStatement(true);
      setTimeout(() => setCopiedStatement(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-ink/40 transition hover:bg-paper hover:text-ink"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-clay text-lg text-white shadow-md">
            ✦
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink md:text-2xl">Studio AI Critique & Palette Lab</h2>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Creator Pro
              </span>
            </div>
            <p className="text-xs text-ink/60">
              Curator-level color harmony, compositional balance, and exhibition statements powered by Gemini Vision.
            </p>
          </div>
        </div>

        {/* Premium Lock Banner if user is not active */}
        {!isPremium && (
          <div className="mt-6 rounded-2xl border border-clay/30 bg-clay/5 p-5 text-ink">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-clay">Creator Pro Feature Locked</p>
                <p className="mt-0.5 text-xs text-ink/70">
                  Your trial or active subscription has expired. Upgrade to Creator Pro to unlock deep composition feedback, palette extractions, and curatorial statements.
                </p>
              </div>
              <button
                onClick={() => alert('Razorpay subscription checkout is ready to be connected for Creator Pro (₹499/mo).')}
                className="shrink-0 rounded-full bg-clay px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-clay/90"
              >
                Upgrade to Pro (₹499/mo)
              </button>
            </div>
          </div>
        )}

        {/* Artwork Selector & Upload */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink/10 bg-paper">
              {previewUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center text-xs text-ink/50">
                  <span>No image selected</span>
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-center">
                <span className="cursor-pointer rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper">
                  Upload another draft
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {defaultTitle && !file && (
                <p className="mt-2 text-center text-xs text-ink/60">Current: {defaultTitle}</p>
              )}
            </div>

            <button
              onClick={runCritique}
              disabled={loading || !isPremium}
              className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark disabled:opacity-50"
            >
              {loading ? 'Analyzing with Gemini…' : 'Generate Full Critique'}
            </button>
            {errorMsg && <p className="mt-2 text-center text-xs text-clay">{errorMsg}</p>}
          </div>

          {/* Results Display */}
          <div className="md:col-span-2">
            {!analysis && !loading && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 p-6 text-center text-ink/60">
                <p className="text-sm font-medium">Ready to analyze your artwork</p>
                <p className="mt-1 max-w-sm text-xs opacity-75">
                  Click &ldquo;Generate Full Critique&rdquo; to extract the full colour scheme, lighting dynamics, and focal composition.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl bg-paper/50 p-6 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-ink">Analyzing composition & colorimetry…</p>
                <p className="mt-1 text-xs text-ink/60">Gemini Vision is evaluating tonal values, visual path, and color balance.</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* 1. Color Palette */}
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink/60">Extracted Palette & Harmony</h3>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      Harmony: {analysis.composition.harmony_score}/100
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {analysis.palette.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => copyToClipboard(c.hex, 'hex', c.hex)}
                        className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 p-2 transition hover:border-brand/40 hover:shadow-sm"
                      >
                        <span
                          className="h-8 w-8 shrink-0 rounded-lg shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">{c.name}</p>
                          <p className="text-[11px] font-mono text-ink/60">
                            {copiedHex === c.hex ? 'Copied!' : c.hex}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Composition & Light Breakdown */}
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink/60">Compositional Dynamics</h3>
                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-paper p-3">
                      <span className="font-bold text-ink">Focal Point & Flow:</span>
                      <p className="mt-1 text-ink/80">{analysis.composition.focal_point}</p>
                    </div>
                    <div className="rounded-xl bg-paper p-3">
                      <span className="font-bold text-ink">Lighting & Contrast:</span>
                      <p className="mt-1 text-ink/80">{analysis.composition.lighting_and_contrast}</p>
                    </div>
                    <div className="rounded-xl bg-paper p-3">
                      <span className="font-bold text-ink">Balance & Visual Weight:</span>
                      <p className="mt-1 text-ink/80">{analysis.composition.balance_and_weight}</p>
                    </div>
                    <div className="rounded-xl bg-paper p-3">
                      <span className="font-bold text-ink">Depth & Texture:</span>
                      <p className="mt-1 text-ink/80">{analysis.composition.brushwork_and_depth}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Critique & Suggestions */}
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink/60">Curator Evaluation</h3>
                  
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-malachite">Key Strengths:</span>
                      <ul className="mt-1 list-inside list-disc text-ink/80">
                        {analysis.critique.key_strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3">
                      <span className="font-bold text-clay">Refinement Opportunities:</span>
                      <ul className="mt-1 list-inside list-disc text-ink/80">
                        {analysis.critique.enhancement_suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3 text-ink/80">
                      <span className="font-bold text-brand">Display & Framing Tip:</span>{' '}
                      {analysis.critique.curator_presentation_tip}
                    </div>
                  </div>
                </div>

                {/* 4. Exhibition Statement */}
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink/60">Gallery Exhibition Statement</h3>
                    <button
                      onClick={() => copyToClipboard(analysis.storyteller_statement, 'statement')}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      {copiedStatement ? '✓ Copied' : 'Copy Statement'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs italic leading-relaxed text-ink/80">
                    &ldquo;{analysis.storyteller_statement}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
