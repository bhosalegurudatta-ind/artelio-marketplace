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

const STOP_WORDS = new Set(['and', 'or', 'the', 'with', 'a', 'an', 'in', 'on', 'of', 'for', 'by', 'to', 'at']);

function stemWord(w: string): string {
  let word = w.toLowerCase().trim();
  if (word.endsWith('es') && word.length > 4) word = word.slice(0, -2);
  else if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) word = word.slice(0, -1);
  else if (word.endsWith('ing') && word.length > 5) word = word.slice(0, -3);
  else if (word.endsWith('ed') && word.length > 4) word = word.slice(0, -2);
  return word;
}

function extractSearchTerms(query: string): string[] {
  if (!query) return [];
  const cleanStr = query.toLowerCase().trim();
  const rawWords = cleanStr.split(/[\s,+/]+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  const terms: string[] = [];
  for (const w of rawWords) {
    terms.push(stemWord(w));
    if (w.includes('-')) {
      const parts = w.split('-').filter((p) => p.length > 1 && !STOP_WORDS.has(p));
      for (const p of parts) {
        terms.push(stemWord(p));
      }
    }
  }
  return Array.from(new Set(terms));
}

function scoreArtwork(
  artwork: any,
  terms: string[],
  rawQuery: string,
  matchingTagIds: Set<string>
): { score: number; matchedTermsCount: number } {
  const qLower = rawQuery.toLowerCase().trim();
  const title = (artwork.title || '').toLowerCase();
  const desc = (artwork.description || '').toLowerCase();
  const med = (artwork.medium || '').toLowerCase();
  const artist = (artwork.artist || artwork.users?.name || '').toLowerCase();

  let score = 0;
  let matchedTermsCount = 0;

  // Exact phrase match bonus
  if (title.includes(qLower)) score += 200;
  else if (med.includes(qLower)) score += 100;
  else if (desc.includes(qLower)) score += 50;
  else if (artist.includes(qLower)) score += 80;

  // Matching tag bonus
  if (matchingTagIds.has(artwork.id)) {
    score += 60;
    matchedTermsCount++;
  }

  // Individual term matching
  for (const term of terms) {
    let termFound = false;
    const inTitle = title.includes(term);
    const inMed = med.includes(term);
    const inArtist = artist.includes(term);
    const inDesc = desc.includes(term);

    if (inTitle) {
      score += 40;
      termFound = true;
    }
    if (inMed) {
      score += 25;
      termFound = true;
    }
    if (inArtist) {
      score += 30;
      termFound = true;
    }
    if (inDesc) {
      score += 15;
      termFound = true;
    }

    if (termFound) matchedTermsCount++;
  }

  return { score, matchedTermsCount };
}

function clean(text: string) {
  return text.replace(/[,()%*]/g, ' ').trim();
}

function BrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = clean(searchParams.get('q') ?? '');
  const tagParam = clean(searchParams.get('tag') ?? '').toLowerCase();
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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      // 1. Tag filter matching: get artwork IDs associated with ?tag=
      let tagFilteredIds: string[] | null = null;
      if (tagParam) {
        const { data: tagRows } = await supabase
          .from('artwork_tags')
          .select('artwork_id')
          .ilike('tag', tagParam);
        tagFilteredIds = (tagRows ?? []).map((r: any) => r.artwork_id);
      }

      // 2. Include tags in search: get artwork IDs whose tags match any query token
      let searchTagIds: string[] = [];
      if (qParam) {
        const terms = extractSearchTerms(qParam);
        if (terms.length > 0) {
          const { data: sTagRows } = await supabase
            .from('artwork_tags')
            .select('artwork_id, tag');
          if (sTagRows) {
            searchTagIds = sTagRows
              .filter((r: any) => {
                const t = (r.tag || '').toLowerCase();
                return terms.some((term) => t.includes(term));
              })
              .map((r: any) => r.artwork_id);
          }
        }
      }

      let query = supabase
        .from('artworks')
        .select('id, title, price, medium, description, image_url, created_at, artist_id, is_digital, is_ai_assisted, users(name, approved)')
        .eq('sold', false);

      // Apply explicit tag filter (?tag=)
      if (tagFilteredIds !== null) {
        if (tagFilteredIds.length === 0) {
          if (!active) return;
          setItems([]);
          setLoading(false);
          return;
        }
        query = query.in('id', tagFilteredIds);
      }

      if (categoryParam) {
        query = query.or(categoryParam.keywords.map((k) => `medium.ilike.%${k}%,title.ilike.%${k}%`).join(','));
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

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
      if (!active) return;

      if (error || !data) {
        console.error('Error fetching artworks from Supabase:', error);
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch active promotions: stop showing when budget is spent or end date passes
      const nowIso = new Date().toISOString();
      const activePromoIds = new Set<string>();
      try {
        const { data: promoRows } = await supabase
          .from('promotions')
          .select('artwork_id, budget, spent, ends_at')
          .eq('status', 'active')
          .gt('ends_at', nowIso);

        (promoRows || []).forEach((p: any) => {
          if (!(p.budget > 0 && p.spent >= p.budget)) {
            activePromoIds.add(p.artwork_id);
          }
        });
      } catch {
        // Fallback gracefully if promotions table is not yet migrated
      }

      let mappedArtworks: Artwork[] = data.map((a: any) => ({
        id: a.id,
        title: a.title,
        price: a.price,
        medium: a.medium ?? '',
        artist: a.users?.name ?? 'Unknown artist',
        imageUrl: a.image_url || null,
        createdAt: a.created_at,
        artistId: a.artist_id,
        isPromoted: activePromoIds.has(a.id),
        artistVerified: Boolean(a.users?.approved),
        isAiAssisted: Boolean(a.is_ai_assisted),
        searchScore: 0,
      }));

      // If search query is present, apply smart relevance filtering & scoring
      if (qParam) {
        const terms = extractSearchTerms(qParam);
        const tagIdSet = new Set(searchTagIds);
        const scored = mappedArtworks.map((art) => {
          const rawItem = data.find((d: any) => d.id === art.id);
          const { score, matchedTermsCount } = scoreArtwork(
            { ...art, description: rawItem?.description || '' },
            terms,
            qParam,
            tagIdSet
          );
          return { ...art, searchScore: score, matchedTermsCount };
        });

        const maxMatches = Math.max(0, ...scored.map((s: any) => s.matchedTermsCount));
        // Threshold: For multi-word queries, require matching at least half the query terms or maxMatches
        const requiredMatches =
          terms.length <= 1 ? 1 : Math.min(maxMatches, Math.max(2, Math.ceil(terms.length * 0.5)));

        mappedArtworks = scored.filter(
          (a: any) => a.searchScore > 0 && a.matchedTermsCount >= requiredMatches
        );
      }

      setItems(mappedArtworks);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [qParam, tagParam, categoryParam?.slug, minParam, maxParam, format]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      // Show active promoted pieces first
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;

      if (sort === 'low') return a.price - b.price;
      if (sort === 'high') return b.price - a.price;

      // If search query is active and default 'new' sort, sort by highest search relevance score
      if (qParam && (b.searchScore ?? 0) !== (a.searchScore ?? 0)) {
        return (b.searchScore ?? 0) - (a.searchScore ?? 0);
      }

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return copy;
  }, [items, sort, qParam]);

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
    categoryParam || qParam || tagParam || minParam !== null || maxParam !== null || format !== 'all'
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 md:px-6">
      {/* Figma Screen 10 Top Search Bar with Mic & Clear */}
      <div className="mb-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <span className="absolute left-3.5 text-[#BBBBBB]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search any Product, Artist, or Art style..."
            className="w-full rounded-xl bg-[#F3F3F3] py-2.5 pl-10 pr-20 text-xs md:text-sm text-[#17223B] placeholder-[#BBBBBB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F83758] border border-transparent focus:border-[#F83758] transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateFilter({ q: null });
              }}
              className="absolute right-10 text-[#BBBBBB] hover:text-[#17223B] p-1 transition"
              title="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => alert('Voice search ready: Try searching for "Oil Painting" or "Handmade Pichwai"')}
            className="absolute right-3 text-[#BBBBBB] hover:text-[#F83758] transition"
            title="Voice Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </form>
      </div>

      {/* Header + Sort & Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F0] pb-3">
        <div>
          <h1 className="text-base md:text-lg font-black text-[#17223B] tracking-tight">
            {sorted.length > 0
              ? `${sorted.length} ${sorted.length === 1 ? 'Artwork' : 'Artworks'}`
              : qParam
              ? '0 Artworks'
              : 'Featured Artworks'}
          </h1>
          {qParam && (
            <p className="text-[11px] font-medium text-[#F83758] mt-0.5">
              Showing results for &ldquo;{qParam}&rdquo;
            </p>
          )}
          {categoryParam && !qParam && (
            <p className="text-[11px] font-medium text-[#F83758] mt-0.5">{categoryParam.label}</p>
          )}
          {tagParam && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF0F3] border border-[#F83758]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#F83758]">
                <span>#{tagParam}</span>
                <button
                  type="button"
                  onClick={() => updateFilter({ tag: null })}
                  className="ml-0.5 text-[#F83758] hover:text-black font-bold text-xs leading-none"
                  title="Remove tag filter"
                >
                  &times;
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown / Pill */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="appearance-none rounded-md border border-[#DEDBDB] bg-white py-1.5 pl-2.5 pr-7 text-xs font-bold text-[#17223B] shadow-xs focus:outline-none focus:border-[#F83758] cursor-pointer"
            >
              <option value="new">Sort: Newest</option>
              <option value="low">Sort: Price Low-High</option>
              <option value="high">Sort: Price High-Low</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#17223B]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
              </svg>
            </span>
          </div>

          {/* Filter Toggle Pill */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold transition shadow-xs ${
              showFilters || hasActiveFilters
                ? 'border-[#F83758] bg-[#FDF0F3] text-[#F83758]'
                : 'border-[#DEDBDB] bg-white text-[#17223B] hover:border-gray-400'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-[#F83758]" />
            )}
          </button>

          {/* AI Room Stylist Button */}
          <button
            onClick={() => setStylistModalOpen(true)}
            className="hidden sm:flex items-center gap-1 rounded-md bg-[#FDF0F3] border border-[#F83758]/20 px-3 py-1.5 text-xs font-bold text-[#F83758] hover:bg-[#F83758] hover:text-white transition"
          >
            <span>🛋️</span> Stylist
          </button>
        </div>
      </div>

      {/* Horizontal Category Scroll (Figma Screen 10 / Stylish) */}
      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1 px-0.5">
        <button
          onClick={() => updateFilter({ category: null })}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition ${
            !categoryParam
              ? 'bg-[#F83758] text-white shadow-xs'
              : 'border border-[#DEDBDB] bg-white text-[#626262] hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => updateFilter({ category: c.slug })}
            className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-bold transition ${
              categoryParam?.slug === c.slug
                ? 'bg-[#F83758] text-white shadow-xs'
                : 'border border-[#DEDBDB] bg-white text-[#626262] hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="mt-3 rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] p-4 text-[#17223B] transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format selection */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#626262] mb-2">
                Artwork Format
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Formats' },
                  { id: 'physical', label: '🖼️ Physical Original' },
                  { id: 'digital', label: '⚡ Digital Master' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFormat(f.id as FormatType);
                      updateFilter({ format: f.id });
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      format === f.id
                        ? 'border border-[#F83758] bg-[#FDF0F3] text-[#F83758]'
                        : 'border border-[#DEDBDB] bg-white text-[#626262] hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Tier */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#626262] mb-2">
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        isActive
                          ? 'border border-[#F83758] bg-[#FDF0F3] text-[#F83758]'
                          : 'border border-[#DEDBDB] bg-white text-[#626262] hover:bg-gray-50'
                      }`}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Chips & Reset */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-[#E8E8E8] pt-3 text-xs">
              <span className="text-[#626262] font-medium">Filters applied</span>
              <button
                onClick={() => router.push('/browse')}
                className="font-bold text-[#F83758] hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Grid - 2 columns on mobile matching Figma Screen 10 */}
      {loading ? (
        <div className="mt-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-[#626262] tracking-wide">
            Loading products…
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-12 rounded-2xl bg-white border border-[#DEDBDB] p-10 text-center shadow-stylish-card">
          <span className="text-4xl">🎨</span>
          <h2 className="mt-3 text-base font-bold text-[#17223B]">
            {qParam ? `No artworks found for "${qParam}"` : 'No products found'}
          </h2>
          <p className="mt-1 text-xs text-[#626262]">
            {qParam
              ? 'Try checking for typos or searching for more general terms like "sketch", "pichwai", "sculpture", or "velvet".'
              : 'Try adjusting your filters or category selection.'}
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              router.push('/browse');
            }}
            className="mt-4 inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
          >
            Clear Search & View All Artworks
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
    <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-8 text-xs text-[#A8A8A9]">Loading products…</main>}>
      <BrowseInner />
    </Suspense>
  );
}
