'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const COMMON_MEDIUMS = [
  'Oil on Canvas',
  'Acrylic on Canvas',
  'Watercolor on Arches Paper',
  'Mixed Media on Wood Panel',
  'Charcoal & Graphite on Paper',
  'Digital Archival Print',
  'Ceramic & Stoneware',
  'Bronze & Cast Metal',
  'Ink & Wash on Silk',
  'Photography & Archival Pigment',
];

export default function EditArtworkPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const artworkId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Artwork fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [shippingFee, setShippingFee] = useState<string>('0');
  const [shipsFrom, setShipsFrom] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sold, setSold] = useState(false);
  const [isDigital, setIsDigital] = useState(false);

  // Price lock state
  const [canEditPrice, setCanEditPrice] = useState(true);
  const [blockingOrderStatus, setBlockingOrderStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtwork() {
      setLoading(true);
      setErrorMessage('');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setAuthorized(false);
          setErrorMessage('Please sign in to edit this artwork.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/artworks/${artworkId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403) {
            setAuthorized(false);
            setErrorMessage('Access Denied: You can only edit artworks that belong to your creator studio.');
          } else {
            setErrorMessage(data.error || 'Failed to load artwork details.');
          }
          setLoading(false);
          return;
        }

        const art = data.artwork;
        setTitle(art.title || '');
        setDescription(art.description || '');
        setMedium(art.medium || '');
        setPrice(art.price ?? '');
        setShippingFee(String(art.shipping_fee ?? 0));
        setShipsFrom(art.ships_from || '');
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setImageUrl(art.image_url || null);
        setSold(Boolean(art.sold));
        setIsDigital(Boolean(art.is_digital));

        setCanEditPrice(data.canEditPrice);
        setBlockingOrderStatus(data.blockingOrderStatus);
      } catch (err: any) {
        console.error('Failed to load artwork:', err);
        setErrorMessage(err.message || 'Error communicating with server.');
      } finally {
        setLoading(false);
      }
    }

    loadArtwork();
  }, [artworkId]);

  function handleAddTags(input: string) {
    if (!input.trim()) return;
    const parts = input.split(/[, ]+/);
    const newTags = [...tags];
    for (const part of parts) {
      const clean = part.toLowerCase().replace(/[^a-z0-9_-]/g, '').trim().slice(0, 20);
      if (clean && !newTags.includes(clean) && newTags.length < 13) {
        newTags.push(clean);
      }
    }
    setTags(newTags);
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter an artwork title.');
      return;
    }

    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice < 1) {
      setErrorMessage('Please enter a valid price (minimum ₹1).');
      return;
    }

    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMessage('Authentication session expired. Please sign in again.');
        setSubmitting(false);
        return;
      }

      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        medium: medium.trim(),
        tags,
      };

      if (!isDigital) {
        payload.shipping_fee = Math.max(0, Math.round(Number(shippingFee) || 0));
        payload.ships_from = shipsFrom.trim();
      }

      if (canEditPrice) {
        payload.price = Math.round(numPrice);
      }

      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save changes.');
      } else {
        setSuccessMessage('Artwork details updated successfully!');
        // Refresh page after a brief delay or return to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error saving artwork:', err);
      setErrorMessage(err.message || 'Something went wrong saving your changes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-white/60">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F83758] border-r-transparent mb-4" />
        <p className="text-sm">Loading artwork for editing...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center text-white">
        <div className="rounded-2xl border border-rose-500/30 bg-[#121826] p-8 shadow-xl">
          <span className="text-4xl">🚫</span>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white">Access Restricted</h1>
          <p className="mt-2 text-sm text-rose-300/90">{errorMessage || 'You do not have permission to edit this artwork.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-[#F83758] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#E02244] transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-white">
      {/* Header Breadcrumbs */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-white/60 hover:text-white transition flex items-center gap-1.5"
        >
          <span>&larr;</span> Back to Creator Dashboard
        </Link>
        <Link
          href={`/artwork/${artworkId}`}
          target="_blank"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          View Live Listing ↗
        </Link>
      </div>

      <div className="mb-8 border-b border-white/10 pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Edit Artwork</h1>
        <p className="mt-1 text-sm text-white/50">
          Update the listing title, story description, medium, and pricing for this piece.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          ✓ {successMessage} Redirecting to dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Artwork Preview Card */}
        <div className="md:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#121826] p-4 space-y-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title || 'Artwork'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                  No preview available
                </div>
              )}

              {sold && (
                <span className="absolute top-2 left-2 rounded-md bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  SOLD
                </span>
              )}

              <span className="absolute bottom-2 left-2 rounded-md bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-medium text-white/80">
                {isDigital ? 'Digital Master' : 'Physical Original'}
              </span>
            </div>

            <div className="text-xs text-white/60 space-y-1">
              <p><strong className="text-white">Artwork ID:</strong> <span className="font-mono">{artworkId.slice(0, 8)}...</span></p>
              <p><strong className="text-white">Format:</strong> {isDigital ? 'Digital Edition' : 'Physical Fine Art'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-[#121826] p-6 sm:p-8">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Artwork Title <span className="text-[#F83758]">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
                placeholder="e.g. Whispers of the Ghats"
              />
              <p className="mt-1 text-[11px] text-white/40">{title.length}/120 characters</p>
            </div>

            {/* Medium Field */}
            <div>
              <label htmlFor="medium" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Medium / Technique <span className="text-[#F83758]">*</span>
              </label>
              <input
                id="medium"
                type="text"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition mb-2"
                placeholder="e.g. Oil on Stretched Belgian Linen"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MEDIUMS.slice(0, 5).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMedium(m)}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/10 hover:text-white transition"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Field with Order Locking Check */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="price" className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Listing Price (INR ₹) <span className="text-[#F83758]">*</span>
                </label>
                {!canEditPrice && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    🔒 Price Locked
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-white/40">₹</span>
                <input
                  id="price"
                  type="number"
                  min="1"
                  max="10000000"
                  step="1"
                  value={price}
                  disabled={!canEditPrice}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className={`w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition ${
                    !canEditPrice ? 'opacity-60 cursor-not-allowed bg-black/60' : ''
                  }`}
                  placeholder="25000"
                />
              </div>

              {!canEditPrice ? (
                <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                  ⚠️ Price changes are locked because this artwork has an order with status &ldquo;<strong>{blockingOrderStatus}</strong>&rdquo;. To safeguard collector receipts and escrow amounts, prices cannot be modified once an order is placed.
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-white/40">
                  You receive 90% (₹{price ? Math.round(Number(price) * 0.9).toLocaleString('en-IN') : '0'}) in escrow after Artelio&rsquo;s 10% platform commission.
                </p>
              )}
            </div>

            {/* Shipping & Fulfillment (Requirement 1) */}
            {!isDigital && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    Shipping &amp; Courier Logistics
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Estimated delivery within 7 days
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shipsFrom" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Ships From (Location)
                    </label>
                    <input
                      id="shipsFrom"
                      type="text"
                      value={shipsFrom}
                      onChange={(e) => setShipsFrom(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
                      placeholder="e.g. Jaipur, Rajasthan"
                    />
                    <p className="mt-1 text-[11px] text-white/40">Studio dispatch city &amp; state.</p>
                  </div>

                  <div>
                    <label htmlFor="shippingFee" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Shipping Fee (INR ₹)
                    </label>
                    <input
                      id="shippingFee"
                      type="number"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
                      placeholder="0 for complimentary shipping"
                    />
                    <p className="mt-1 text-[11px] text-white/40">Enter 0 for free insured delivery.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Artist Description &amp; Story
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition leading-relaxed"
                placeholder="Share the inspiration, technique, emotional context, or materials behind this artwork..."
              />
              <p className="mt-1 text-[11px] text-white/40">
                Detailed descriptions help collectors connect with your creative process and boost conversion.
              </p>
            </div>

            {/* Tags Field (Up to 13) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Artwork Tags (Up to 13)
                </label>
                <span className="text-[11px] text-white/50">{tags.length}/13 tags</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-white"
                  >
                    <span className="text-[#F83758]">#</span>{t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((item) => item !== t))}
                      className="text-white/60 hover:text-[#F83758] font-bold text-sm leading-none ml-0.5 transition"
                      aria-label={`Remove tag ${t}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {tags.length < 13 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    maxLength={20}
                    placeholder="Add tag (e.g. landscape, oil, modern) and press Enter"
                    className="flex-1 min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTags(tagInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTags(tagInput)}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-white/40">
                Lowercase, trimmed, no duplicates. Max 20 characters per tag. Tags power collector discovery in browse &amp; search.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-[#F83758] to-[#E02244] px-7 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
