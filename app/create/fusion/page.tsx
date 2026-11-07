'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ArtworkSummary = {
  id: string;
  title: string;
  medium?: string | null;
  image_url: string | null;
  price: number;
};

const SUGGESTED_PROMPTS = [
  'Ethereal moonlit dunes with textured impasto brushwork',
  'Monsoon over Banaras ghats with golden ambient reflections',
  'Abstract geometric harmony of warm earth ochres and deep indigo',
  'Minimalist botanical silhouette at dawn with misty gradient haze',
];

export default function FusionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userArtworks, setUserArtworks] = useState<ArtworkSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cap, setCap] = useState<number>(5);
  const [isPremium, setIsPremium] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedPiece, setGeneratedPiece] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push('/login?redirect=/create/fusion');
        return;
      }

      // 1. Fetch artist's existing artworks
      const { data: artworks } = await supabase
        .from('artworks')
        .select('id, title, medium, image_url, price')
        .eq('artist_id', userData.user.id)
        .order('created_at', { ascending: false });

      setUserArtworks(artworks || []);

      // 2. Fetch monthly fusion quota & remaining uses from server
      try {
        const { data: session } = await supabase.auth.getSession();
        const res = await fetch('/api/fusion', {
          headers: {
            Authorization: `Bearer ${session.session?.access_token}`,
          },
        });
        if (res.ok) {
          const quota = await res.json();
          setRemaining(quota.remaining);
          if (quota.cap) setCap(quota.cap);
          setIsPremium(Boolean(quota.isPremium));
        }
      } catch (e) {
        console.error('Could not load fusion quota:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  function toggleSelect(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 3) {
        setErrorMsg('You can choose up to 3 reference artworks.');
        return;
      }
      setErrorMsg('');
      setSelectedIds([...selectedIds, id]);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least 1 reference artwork from your portfolio.');
      return;
    }

    if (selectedIds.length > 3) {
      setErrorMsg('You can select a maximum of 3 reference artworks.');
      return;
    }

    if (!prompt.trim()) {
      setErrorMsg('Please enter a short artistic prompt.');
      return;
    }

    if (remaining !== null && remaining <= 0) {
      setErrorMsg('Monthly fusion cap reached. Your quota refreshes on the 1st of next month.');
      return;
    }

    setGenerating(true);
    setGeneratedPiece(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      // Browser never sends model key or cap: server enforces both
      const res = await fetch('/api/fusion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artworkIds: selectedIds,
          prompt: prompt.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to generate style fusion artwork.');
      } else {
        setGeneratedPiece(data.artwork);
        if (typeof data.remaining === 'number') {
          setRemaining(data.remaining);
        }
      }
    } catch {
      setErrorMsg('Network error while synthesizing artwork. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center text-white">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-r-transparent mb-3" />
        <p className="text-sm text-white/60">Loading your Atelier studio artworks…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#626262] hover:text-[#17223B] transition"
        >
          <span>←</span> Back to Studio
        </Link>

        {/* Quota & Premium Indicator */}
        <div className="flex items-center gap-2">
          {isPremium ? (
            <span className="rounded-full px-3.5 py-1 text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 shadow-xs flex items-center gap-1.5">
              <span>👑</span> Creator Pro: Unlimited AI Fusions
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  remaining !== null && remaining > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-rose-300 bg-rose-50 text-rose-700'
                }`}
              >
                ✨ {remaining !== null ? `${remaining} of ${cap}` : `${cap}`} free fusions left
              </span>
              <Link
                href="/dashboard/billing"
                className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-3 py-1 text-xs font-bold text-white shadow-xs hover:opacity-90 transition"
              >
                ⚡ Upgrade to Unlimited
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-700 mb-2">
          <span>🎨</span> AI Style Fusion Generator
        </div>
        <h1 className="font-serif text-2xl md:text-4xl font-extrabold text-[#17223B] tracking-tight">
          Synthesize Your Signature Style
        </h1>
        <p className="mt-2 text-xs md:text-sm text-[#626262] max-w-2xl leading-relaxed">
          Blend the textures, brushwork, and color schemes of up to 3 of your own original pieces into a brand new
          digital masterpiece. Watermarked and safely saved to your drafts.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-vermilion/40 bg-vermilion/15 p-4 text-xs text-vermilion flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success View when a piece is generated */}
      {generatedPiece && (
        <div className="mb-10 rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50/70 via-white to-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                ✓
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#17223B]">Style Fusion Generated &amp; Saved!</h2>
                <p className="text-xs text-[#626262]">Stored as a private draft in your studio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                🔒 Hidden Draft
              </span>
              <span className="rounded-full bg-[#FDF0F3] border border-brand/30 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                ✦ AI-Assisted
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5">
              <div
                className="relative aspect-square w-full rounded-xl bg-[#F3F3F3] bg-cover bg-center border border-[#DEDBDB] overflow-hidden shadow-xs"
                style={generatedPiece.image_url ? { backgroundImage: `url(${generatedPiece.image_url})` } : undefined}
              >
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] text-white/90 font-medium">
                  Watermarked Preview
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-3">
              <h3 className="font-serif text-xl font-bold text-[#17223B]">{generatedPiece.title}</h3>
              <p className="text-xs text-[#626262] whitespace-pre-line leading-relaxed">
                {generatedPiece.description}
              </p>

              <div className="rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-3 text-xs text-[#626262] space-y-1">
                <p className="text-[#17223B] font-semibold">📋 Draft Artwork Status:</p>
                <p>• Marked as <strong className="text-[#17223B]">is_ai_assisted = true</strong></p>
                <p>• Marked as <strong className="text-[#17223B]">is_hidden = true</strong> (not visible in public gallery until published)</p>
                <p>• Watermarked with official Artelio diagonal fine-art pattern via makePreview</p>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/dashboard/artwork/${generatedPiece.id}/edit`}
                  className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
                >
                  ✏️ Edit Pricing &amp; Publish Artwork
                </Link>
                <button
                  onClick={() => {
                    setGeneratedPiece(null);
                    setPrompt('');
                    setSelectedIds([]);
                  }}
                  className="rounded-full border border-[#DEDBDB] bg-white px-4 py-2.5 text-xs font-semibold text-[#17223B] hover:bg-[#F3F3F3] transition shadow-xs"
                >
                  ✨ Create Another Fusion
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[#DEDBDB] px-4 py-2.5 text-xs font-semibold text-[#626262] hover:text-[#17223B] transition"
                >
                  View in Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Generation Form */}
      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Step 1: Select up to 3 Reference Artworks */}
        <section className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#17223B]">
                Step 1: Pick Up To 3 Reference Artworks ({selectedIds.length}/3)
              </h2>
              <p className="text-xs text-[#626262]">
                Click to select 1, 2, or 3 of your existing works to infuse their style, palette, and texture.
              </p>
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-[#F83758] hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>

          {userArtworks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DEDBDB] p-8 text-center text-xs text-[#626262] bg-[#FAFAFA]">
              <p>You have not uploaded any artworks to your portfolio yet.</p>
              <Link
                href="/dashboard/upload"
                className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark shadow-xs"
              >
                + Upload your first artwork
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto p-1 pr-2">
              {userArtworks.map((art) => {
                const isSelected = selectedIds.includes(art.id);
                return (
                  <button
                    type="button"
                    key={art.id}
                    onClick={() => toggleSelect(art.id)}
                    className={`relative flex flex-col rounded-xl border text-left p-2 transition-all group ${
                      isSelected
                        ? 'border-[#F83758] bg-[#FDF0F3] shadow-xs scale-[1.02]'
                        : 'border-[#E8E8E8] bg-[#FAFAFA] hover:border-[#DEDBDB]'
                    }`}
                  >
                    <div
                      className="relative aspect-square w-full rounded-lg bg-[#F3F3F3] bg-cover bg-center overflow-hidden mb-2 border border-[#E8E8E8]"
                      style={art.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-[#F83758] text-white flex items-center justify-center text-xs font-bold shadow-md">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#17223B] truncate w-full">{art.title}</p>
                    <p className="text-[11px] text-[#626262] truncate w-full">{art.medium || 'Artwork'}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: Write a Short Prompt */}
        <section className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#17223B]">
              Step 2: Artistic Direction &amp; Vision Prompt
            </h2>
            <p className="text-xs text-[#626262]">
              Describe the new subject, mood, or setting you want to generate using your selected styles.
            </p>
          </div>

          <textarea
            required
            rows={3}
            placeholder="e.g. Floating lotus temple in cosmic indigo nebula, thick textured brushstrokes, golden luminescence..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] p-3.5 text-sm text-[#17223B] placeholder-[#9E9E9E] focus:border-brand focus:bg-white focus:outline-none transition"
          />

          {/* Quick inspiration chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-[#626262] font-semibold">Inspiration:</span>
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPrompt(p)}
                className="rounded-full border border-[#DEDBDB] bg-[#F3F3F3] px-2.5 py-1 text-[11px] font-medium text-[#17223B] hover:bg-[#E8E8E8] transition"
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Action Button & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-[#626262] space-y-0.5 text-center sm:text-left">
            <p>• Powered by Google Imagen 3 fine-art diffusion</p>
            <p>• Watermarked with official Artelio pattern &amp; saved to private drafts</p>
          </div>

          <button
            type="submit"
            disabled={generating || selectedIds.length === 0 || !prompt.trim() || (remaining !== null && remaining <= 0 && !isPremium)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-8 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-stylish-btn hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                <span>Synthesizing Style Fusion...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Style Fusion</span>
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
