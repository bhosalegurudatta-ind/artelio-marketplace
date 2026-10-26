'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES, findCategory } from '@/lib/categories';
import InteriorStylistModal from '@/components/InteriorStylistModal';

type Sort = 'new' | 'low' | 'high';
type FormatType = 'all' | 'physical' | 'digital';

const PRICE_TIERS = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under ₹2,500', min: null, max: 2500 },
  { label: '₹2,500 – ₹10,000', min: 2500, max: 10000 },
  { label: '₹10,000 – ₹25,000', min: 10000, max: 25000 },
  { label: '₹25,000+', min: 25000, max: null },
];

function clean(text: string) {
  return text.replace(/[,()%*]/g, ' ').trim();
}

function BrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = clean(searchParams.get('q') ?? '');
  const categoryParam = findCategory(searchParams.get('category'));
  const minParam = Number(searchParams.get('min')) || null;
  const maxParam = Number(searchParams.get('max')) || null;
  const formatParam = (searchParams.get('format') as FormatType) || 'all';

  const [searchInput, setSearchInput] = useState(qParam);
  const [sort, setSort] = useState<Sort>('new');
  const [format, setFormat] = useState<FormatType>(formatParam);
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [stylistModalOpen, setStylistModalOpen] = useState(false);

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      let query = supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, is_digital, users(name)')
        .eq('sold', false);

      if (qParam) {
        query = query.or(`title.ilike.%${qParam}%,medium.ilike.%${qParam}%,description.ilike.%${qParam}%`);
      }
      if (categoryParam) {
        query = query.or(categoryParam.keywords.map((k) => `medium.ilike.%${k}%`).join(','));
      }
      if (minParam !== null) {
        query = query.gte('price', minParam);
      }
      if (maxParam !== null) {
        query = query.lte('price', maxParam);
      }
      if (format === 'physical') {
        query = query.eq('is_digital', false);
      } else if (format === 'digital') {
        query = query.eq('is_digital', true);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(100);
      if (!active) return;

      setItems(
        (data ?? []).map((a: any) => ({
          id: a.id,
          title: a.title,
          price: a.price,
          medium: a.medium ?? '',
          artist: a.users?.name ?? 'Unknown artist',
          imageUrl: a.image_url || null,
          createdAt: a.created_at,
          artistId: a.artist_id,
        }))
      );
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [qParam, categoryParam?.slug, minParam, maxParam, format]);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === 'low') copy.sort((a, b) => a.price - b.price);
    if (sort === 'high') copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [items, sort]);

  function updateFilter(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    router.push(`/browse?${next.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ q: searchInput.trim() || null });
  }

  const hasActiveFilters = Boolean(
    categoryParam || qParam || minParam !== null || maxParam !== null || format !== 'all'
  );

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
      {/* Top Header & AI Interior Stylist Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">
            {categoryParam ? categoryParam.label : qParam ? `Results for "${qParam}"` : 'Curated Fine Art'}
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Original paintings, digital masterworks, and drawings from independent creator ateliers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setStylistModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amethyst via-brand to-magenta px-4 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
          >
            <span>🛋️</span> AI Room Interior Stylist
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#131B2A] px-3 py-1.5 text-xs text-white">
            <span className="text-white/60 font-semibold">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="new" className="bg-[#131B2A]">Newest First</option>
              <option value="low" className="bg-[#131B2A]">Price: Low → High</option>
              <option value="high" className="bg-[#131B2A]">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-[#121826]/70 p-4 md:p-5 backdrop-blur-md">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, style (e.g. oil, landscape, abstract), or artist name..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-brand focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateFilter({ q: null });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand-dark transition"
          >
            Search
          </button>
        </form>

        {/* Medium Categories Pills */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Artistic Medium</span>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => updateFilter({ category: null })}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                !categoryParam
                  ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white font-bold'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All Mediums
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => updateFilter({ category: c.slug })}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  categoryParam?.slug === c.slug
                    ? 'bg-gradient-to-r from-brand to-magenta text-white font-bold'
                    : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format & Price Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
          {/* Format (Physical vs Digital) */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">
              Artwork Format
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Works' },
                { id: 'physical', label: '🖼️ Physical Originals' },
                { id: 'digital', label: '⚡ Digital Editions' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFormat(f.id as FormatType);
                    updateFilter({ format: f.id });
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    format === f.id
                      ? 'border border-brand bg-brand/15 text-white font-semibold'
                      : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">
              Price Range
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_TIERS.map((tier) => {
                const isActive =
                  (tier.min === null && tier.max === null && minParam === null && maxParam === null) ||
                  (tier.min === minParam && tier.max === maxParam);

                return (
                  <button
                    key={tier.label}
                    onClick={() =>
                      updateFilter({
                        min: tier.min ? String(tier.min) : null,
                        max: tier.max ? String(tier.max) : null,
                      })
                    }
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? 'border border-marigold bg-marigold/15 text-marigold font-bold'
                        : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filter Chips & Clear All */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-xs">
            <span className="text-white/40">Active Filters:</span>
            {categoryParam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-0.5 text-brand-soft">
                {categoryParam.label}
                <button onClick={() => updateFilter({ category: null })}>✕</button>
              </span>
            )}
            {qParam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-0.5 text-brand-soft">
                &ldquo;{qParam}&rdquo;
                <button onClick={() => updateFilter({ q: null })}>✕</button>
              </span>
            )}
            {(minParam !== null || maxParam !== null) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-marigold/20 px-2.5 py-0.5 text-marigold">
                Price: {minParam ? `₹${minParam.toLocaleString('en-IN')}` : '₹0'} – {maxParam ? `₹${maxParam.toLocaleString('en-IN')}` : 'Above'}
                <button onClick={() => updateFilter({ min: null, max: null })}>✕</button>
              </span>
            )}
            {format !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-emerald-300">
                Format: {format}
                <button onClick={() => updateFilter({ format: null })}>✕</button>
              </span>
            )}
            <button
              onClick={() => router.push('/browse')}
              className="text-xs text-clay hover:underline ml-auto"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="mt-6 flex items-center justify-between text-xs text-white/60">
        <p>Showing <strong className="text-white font-mono">{sorted.length}</strong> available original works</p>
        <span className="text-malachite font-medium">✓ Escrow Protection & Transit Insurance Included</span>
      </div>

      {/* Artwork Grid */}
      {loading ? (
        <div className="mt-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-white/50 uppercase tracking-widest">
            Curating gallery works…
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-[#121826] border border-white/10 p-12 text-center shadow-lg">
          <span className="text-4xl">🎨</span>
          <h2 className="mt-3 text-lg font-serif font-bold text-white">No artworks match your selected filters</h2>
          <p className="mt-2 text-xs text-white/65 max-w-sm mx-auto">
            Try adjusting your price range or exploring another artistic medium.
          </p>
          <button
            onClick={() => router.push('/browse')}
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-magenta px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
          >
            Clear Filters & View All
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      )}

      <InteriorStylistModal
        isOpen={stylistModalOpen}
        onClose={() => setStylistModalOpen(false)}
      />
    </main>
  );
}

export default function Browse() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-[1240px] px-5 py-8 text-ink/40 text-sm">Loading gallery…</main>}>
      <BrowseInner />
    </Suspense>
  );
}
