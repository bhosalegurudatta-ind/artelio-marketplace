'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES, findCategory } from '@/lib/categories';
import InteriorStylistModal from '@/components/InteriorStylistModal';

type Sort = 'new' | 'low' | 'high';

// Characters that have special meaning inside a Supabase filter string.
function clean(text: string) {
  return text.replace(/[,()%*]/g, ' ').trim();
}

function BrowseInner() {
  const params = useSearchParams();
  const q = clean(params.get('q') ?? '');
  const category = findCategory(params.get('category'));
  const maxRaw = Number(params.get('max'));
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null;

  const [sort, setSort] = useState<Sort>('new');
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [stylistModalOpen, setStylistModalOpen] = useState(false);

  const categorySlug = category?.slug ?? null;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      let query = supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, users(name)')
        .eq('sold', false);

      if (q) query = query.or(`title.ilike.%${q}%,medium.ilike.%${q}%,description.ilike.%${q}%`);
      if (category) query = query.or(category.keywords.map((k) => `medium.ilike.%${k}%`).join(','));
      if (max) query = query.lte('price', max);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categorySlug, max]);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === 'low') copy.sort((a, b) => a.price - b.price);
    if (sort === 'high') copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [items, sort]);

  const heading = category
    ? category.label
    : q
    ? `Results for "${q}"`
    : max
    ? `Original art under ₹${max.toLocaleString('en-IN')}`
    : 'All artworks';

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink md:text-4xl tracking-normal flex items-center gap-2">
            <span>{heading}</span>
          </h1>
          {!loading && (
            <p className="mt-1.5 text-xs text-ink/60 tracking-wide font-medium">
              ✦ {sorted.length} {sorted.length === 1 ? 'curated original' : 'curated originals'} currently available
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStylistModalOpen(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amethyst via-brand to-magenta px-4 py-2.5 text-xs font-bold text-white tracking-wide transition-all hover:scale-105 hover:shadow-art-glow shadow-sm"
          >
            <span>🛋️</span> AI Room Interior Stylist
          </button>

          <label className="flex items-center gap-2 text-xs text-ink/70 font-bold">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-sm"
            >
              <option value="new">Newest Additions</option>
              <option value="low">Price: low → high</option>
              <option value="high">Price: high → low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/browse"
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 ${
            !category && !q && !max
              ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white shadow-sm'
              : 'border border-ink/10 text-ink/75 hover:border-brand/40 hover:text-brand bg-white'
          }`}
        >
          All Mediums
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/browse?category=${c.slug}`}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 ${
              category?.slug === c.slug
                ? 'bg-gradient-to-r from-brand to-magenta text-white shadow-sm'
                : 'border border-ink/10 text-ink/75 hover:border-brand/40 hover:text-brand bg-white'
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="mt-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-ink/50 uppercase tracking-widest">Curating gallery works…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-white border border-black/[0.08] p-12 text-center shadow-sm">
          <span className="text-4xl">🎨</span>
          <p className="mt-3 text-lg font-serif font-bold text-ink">No artworks match your search filter</p>
          <p className="mt-2 text-xs text-ink/65 max-w-sm mx-auto">
            Try choosing a different artistic medium or clear the search filters to explore all creations.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-magenta px-6 py-3 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
          >
            Explore All Artworks
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
    <Suspense fallback={<main className="mx-auto max-w-[1240px] px-5 py-8 text-ink/40 text-sm">Loading…</main>}>
      <BrowseInner />
    </Suspense>
  );
}
