'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RoomAnalysis {
  aesthetic: string;
  dominant_tones: string[];
  lighting_vibe: string;
  recommended_art_style: string;
  recommended_frame: string;
}

interface StylistMatch {
  artwork_id: string;
  match_score: number;
  designer_rationale: string;
  artwork: {
    id: string;
    title: string;
    price: number;
    medium: string;
    imageUrl: string;
    artist: string;
  };
}

interface StylistResponse {
  room_analysis: RoomAnalysis;
  curator_note: string;
  recommendations: StylistMatch[];
}

export default function InteriorStylistModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StylistResponse | null>(null);

  if (!isOpen) return null;

  async function compressImage(sourceFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(sourceFile);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(sourceFile);
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => resolve(sourceFile);
      img.src = URL.createObjectURL(sourceFile);
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setData(null);
      setError(null);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      setError('Please choose or upload a photo of your room wall first.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const compressedBlob = await compressImage(file);
      const fd = new FormData();
      fd.append('roomImage', compressedBlob, 'room.jpg');

      const res = await fetch('/api/ai/interior-stylist', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze room.');
      }

      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error running AI Interior Stylist.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-6 w-full max-w-4xl rounded-3xl bg-[#121826] text-white shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0B0F19]/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white text-base">🛋️</span>
            <div>
              <h2 className="text-lg font-serif font-bold text-white">AI Interior Stylist &amp; Art Matcher</h2>
              <p className="text-xs text-white/60">Upload your room wall photo to get curated art pairings tailored to your decor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Upload / Room View */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                  Your Room or Wall Photo
                </label>
                {previewUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-ink/15 bg-paper">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Your room" className="h-full w-full object-cover" />
                    <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white hover:bg-black transition">
                      Change Room Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>
                ) : (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-paper/50 hover:border-brand hover:bg-paper transition p-6 text-center">
                    <span className="text-4xl mb-2">📸</span>
                    <span className="text-sm font-semibold text-ink">Snap or Upload Your Wall</span>
                    <span className="text-xs text-ink/50 mt-1 max-w-[200px]">
                      Living room, bedroom, office wall or dining space (JPG, PNG)
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand py-3 text-sm font-bold text-white shadow-md hover:shadow-art-glow hover:scale-[1.01] disabled:opacity-50 transition-all"
                >
                  {loading ? 'Stylist analyzing room architecture…' : '✦ Match Artworks for My Space'}
                </button>
              )}

              {error && <p className="text-xs text-clay font-medium">{error}</p>}

              {/* Room Aesthetic Breakdown Card */}
              {data && (
                <div className="rounded-2xl border border-white/10 bg-[#161F30] p-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Detected Aesthetic</span>
                    <p className="font-bold text-white text-sm">{data.room_analysis.aesthetic}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-white/60">Dominant Wall &amp; Decor Tones</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {data.room_analysis.dominant_tones.map((hex, i) => (
                        <div key={i} className="flex items-center gap-1 rounded-full border border-white/10 bg-[#121826] px-2 py-0.5 text-[11px]">
                          <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: hex }} />
                          <span className="font-mono text-white/70">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-white/60">Lighting &amp; Ambiance</span>
                    <p className="text-xs text-white/80">{data.room_analysis.lighting_vibe}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-white/60">Recommended Framing</span>
                    <p className="text-xs text-white/80">{data.room_analysis.recommended_frame}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Matched Artworks */}
            <div className="md:col-span-7 flex flex-col justify-start">
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent mb-4" />
                  <p className="font-semibold text-ink">Analyzing lighting, perspective, and complementary colors…</p>
                  <p className="text-xs text-ink/60 mt-1">Comparing against original artworks in Artelio gallery catalog.</p>
                </div>
              )}

              {!loading && !data && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center rounded-2xl border border-dashed border-ink/15 bg-paper/40 p-6">
                  <span className="text-4xl mb-3">🎨</span>
                  <h3 className="font-semibold text-ink">Personalized Art Curation</h3>
                  <p className="text-xs text-ink/60 max-w-sm mt-1">
                    Upload a photo of your wall on the left and tap &quot;Match Artworks&quot;. Our AI will find the finest original pieces that blend harmoniously with your furniture, wall colors, and lighting.
                  </p>
                </div>
              )}

              {!loading && data && (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {/* Curator note */}
                  <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Curator&apos;s Room Note</span>
                    <p className="mt-1 text-xs leading-relaxed text-ink/80 italic">
                      &quot;{data.curator_note}&quot;
                    </p>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    Top Matched Artworks for Your Wall ({data.recommendations.length})
                  </h3>

                  {data.recommendations.map((rec) => (
                    <div
                      key={rec.artwork_id}
                      className="group flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-white/10 bg-[#161F30] p-3.5 shadow-sm transition hover:shadow-md"
                    >
                      <Link href={`/artwork/${rec.artwork.id}`} className="shrink-0 overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rec.artwork.imageUrl}
                          alt={rec.artwork.title}
                          className="h-28 w-24 rounded-xl object-cover transition duration-300 group-hover:scale-105"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/artwork/${rec.artwork.id}`} className="truncate font-semibold text-ink hover:text-brand transition text-sm">
                            {rec.artwork.title}
                          </Link>
                          <span className="rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-xs font-bold">
                            ✦ {rec.match_score}% match
                          </span>
                        </div>
                        <p className="text-xs text-ink/60 mt-0.5">{rec.artwork.artist} • ₹{rec.artwork.price.toLocaleString('en-IN')}</p>
                        
                        <p className="mt-2 text-xs leading-relaxed text-ink/80 bg-paper/60 p-2.5 rounded-xl border border-ink/5">
                          <span className="font-semibold text-ink">Stylist insight: </span>
                          {rec.designer_rationale}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/artwork/${rec.artwork.id}`}
                            className="rounded-full bg-brand px-3.5 py-1 text-xs font-semibold text-white hover:bg-brand-dark transition"
                          >
                            View Artwork
                          </Link>
                          <Link
                            href={`/artwork/${rec.artwork.id}`}
                            className="rounded-full border border-ink/15 px-3.5 py-1 text-xs font-medium text-ink/70 hover:border-brand hover:text-brand transition"
                          >
                            ✦ View on My Wall
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
