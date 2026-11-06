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

      // Check if current user is admin
      let isAdmin = false;
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: prof } = await supabase.from('users').select('role').eq('id', userData.user.id).maybeSingle();
        if (prof?.role === 'admin') isAdmin = true;
      }

      // 1. Tag filter matching: get artwork IDs associated with ?tag=
      let tagFilteredIds: string[] | null = null;
      if (tagParam) {
        const { data: tagRows } = await supabase
          .from('artwork_tags')
          .select('artwork_id')
          .ilike('tag', tagParam);
        tagFilteredIds = (tagRows ?? []).map((r: any) => r.artwork_id);
      }

      // 2. Include tags in search: get artwork IDs whose tags match ?q=
      let searchTagIds: string[] = [];
      if (qParam) {
        const { data: sTagRows } = await supabase
          .from('artwork_tags')
          .select('artwork_id')
          .ilike('tag', `%${qParam}%`);
        searchTagIds = (sTagRows ?? []).map((r: any) => r.artwork_id);
      }

      let query = supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, is_digital, is_hidden, users(name)')
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

      // Search query includes title, medium, description, AND matching tags
      if (qParam) {
        const tagInClause = searchTagIds.length > 0 ? `,id.in.(${searchTagIds.slice(0, 50).join(',')})` : '';
        query = query.or(`title.ilike.%${qParam}%,medium.ilike.%${qParam}%,description.ilike.%${qParam}%${tagInClause}`);
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

      const visible = (data ?? []).filter((a: any) => isAdmin || !a.is_hidden);

      setItems(
        visible.map((a: any) => ({
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
  }, [qParam, tagParam, categoryParam?.slug, minParam, maxParam, format]);

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
    categoryParam || qParam || tagParam || minParam !== null || maxParam !== null || format !== 'all'
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 md:px-6">
      {/* Figma Screen 10 Top Search Bar with Mic */}
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
            placeholder="Search any Product or Art style.."
            className="w-full rounded-xl bg-[#F3F3F3] py-2.5 pl-10 pr-12 text-xs md:text-sm text-[#17223B] placeholder-[#BBBBBB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F83758] border border-transparent focus:border-[#F83758] transition"
          />
          <button
            type="button"
            onClick={() => alert('Voice search activated. Listening...')}
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

      {/* Figma Screen 10: "52,082+ Items" Header + Sort & Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F0] pb-3">
        <div>
          <h1 className="text-base md:text-lg font-black text-[#17223B] tracking-tight">
            {sorted.length > 0 ? `${sorted.length.toLocaleString()}+ Items` : 'Featured Items'}
          </h1>
          {categoryParam && (
            <p className="text-[11px] font-medium text-[#F83758]">{categoryParam.label}</p>
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
          <span className="text-4xl">🛍️</span>
          <h2 className="mt-3 text-base font-bold text-[#17223B]">No products found</h2>
          <p className="mt-1 text-xs text-[#626262]">
            Try adjusting your search query or removing filters.
          </p>
          <button
            onClick={() => router.push('/browse')}
            className="mt-4 inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
          >
            View All Products
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
