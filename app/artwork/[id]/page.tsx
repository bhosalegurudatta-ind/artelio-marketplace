'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import GenerativeArt from '@/components/GenerativeArt';
import RoomVisualizerModal from '@/components/RoomVisualizerModal';
import { CATEGORIES } from '@/lib/categories';

type Detail = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  price: number;
  image_url: string | null;
  artist_id: string;
  artist_name: string;
  sold: boolean;
  is_digital: boolean;
};

const categoriesOf = (medium: string | null) =>
  CATEGORIES.filter((c) => c.keywords.some((k) => (medium ?? '').toLowerCase().includes(k))).map((c) => c.slug);

export default function ArtworkDetail() {
  const params = useParams();
  const [art, setArt] = useState<Detail | null>(null);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const [similar, setSimilar] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('artworks')
        .select('id, title, description, medium, price, image_url, artist_id, sold, is_digital, users(name)')
        .eq('id', params.id)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }
      const detail: Detail = { ...(data as any), artist_name: (data as any).users?.name ?? 'Unknown artist' };
      setArt(detail);

      const { data: reviews } = await supabase.from('reviews').select('rating').eq('artist_id', detail.artist_id);
      if (reviews && reviews.length > 0) {
        const total = reviews.reduce((s: number, r: any) => s + r.rating, 0);
        setRating({ avg: total / reviews.length, count: reviews.length });
      }

      // "More like this": same category, similar price, or the same artist. Plain matching, not AI.
      const { data: others } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, users(name)')
        .eq('sold', false)
        .neq('id', detail.id)
        .order('created_at', { ascending: false })
        .limit(40);

      const mine = categoriesOf(detail.medium);
      const scored = (others ?? [])
        .map((o: any) => {
          let score = 0;
          if (categoriesOf(o.medium).some((c) => mine.includes(c))) score += 2;
          if (o.price >= detail.price * 0.5 && o.price <= detail.price * 2) score += 1;
          if (o.artist_id === detail.artist_id) score += 1;
          return { o, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ o }) => ({
          id: o.id,
          title: o.title,
          price: o.price,
          medium: o.medium ?? '',
          artist: o.users?.name ?? 'Unknown artist',
          imageUrl: o.image_url || null,
          createdAt: o.created_at,
          artistId: o.artist_id,
        }));
      setSimilar(scored);

      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <main className="mx-auto max-w-[1240px] px-5 py-20 text-center text-sm text-ink/40">Loading piece details…</main>;

  if (!art) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink">Piece Not Found</h2>
        <p className="mt-2 text-sm text-ink/60">This piece couldn't be found. It may have been removed or sold.</p>
        <Link href="/browse" className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-ink/80 transition-colors">
          Browse artworks
        </Link>
      </main>
    );
  }

  const unavailable = art.sold && !art.is_digital;

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10 md:py-14">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-ink/50">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-ink transition-colors">Artworks</Link>
        <span>/</span>
        <span className="truncate max-w-[200px] text-ink/80 font-medium">{art.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 items-start">
        {/* Left: Gallery Artwork Frame */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-ink/[0.08] bg-white p-3 shadow-2xl">
            <div
              className="relative h-full w-full overflow-hidden rounded-2xl bg-paper bg-cover bg-center transition-transform duration-700 hover:scale-[1.02]"
              style={art.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}
            >
              {!art.image_url && <GenerativeArt seed={art.id} className="block h-full w-full" />}
              {unavailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <span className="rounded-full bg-white/95 px-5 py-2 font-serif text-sm font-bold tracking-widest text-ink uppercase shadow-lg">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-ink/40">
            Watermarked preview • High-resolution original released upon acquisition
          </p>
        </div>

        {/* Right: Artwork Details & Acquisition */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="border-b border-ink/[0.08] pb-6">
            <div className="flex items-center justify-between gap-4">
              {art.medium && (
                <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand tracking-wide uppercase">
                  {art.medium}
                </span>
              )}
              {rating && (
                <div className="flex items-center gap-1.5 rounded-full bg-marigold/10 px-3 py-1 text-xs font-semibold text-ink">
                  <span className="text-marigold">★</span>
                  <span>{rating.avg.toFixed(1)}</span>
                  <span className="text-ink/40 font-normal">({rating.count})</span>
                </div>
              )}
            </div>

            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-ink md:text-4xl">
              {art.title}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-ink/50">Curated by</span>
              <Link
                href={`/artist/${art.artist_id}`}
                className="group flex items-center gap-1 text-xs font-bold text-ink hover:text-brand transition-colors"
              >
                <span>{art.artist_name}</span>
                <span className="text-ink/30 group-hover:translate-x-0.5 group-hover:text-brand transition-all">→</span>
              </Link>
            </div>
          </div>

          <div className="py-6 border-b border-ink/[0.08]">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl font-extrabold text-ink tracking-tight">
                ₹{art.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-ink/50">Taxes included</span>
            </div>

            <p className="mt-4 text-xs font-medium text-ink/70 flex items-center gap-2">
              <span className="text-brand">✦</span>
              {art.is_digital
                ? 'Instant full-fidelity digital master download included'
                : 'Direct studio shipping in protective collector-grade packaging'}
            </p>
          </div>

          {art.description && (
            <div className="py-6 border-b border-ink/[0.08]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">About the Work</h3>
              <p className="text-sm leading-relaxed text-ink/80 whitespace-pre-line font-normal">
                {art.description}
              </p>
            </div>
          )}

          {/* Acquisition & Action Bar */}
          <div className="pt-6 flex flex-col gap-3">
            {unavailable ? (
              <button disabled className="w-full rounded-full bg-ink/10 py-4 text-sm font-semibold text-ink/40 cursor-not-allowed">
                Piece Acquired / Sold
              </button>
            ) : (
              <Link
                href={`/checkout/${art.id}`}
                className="flex items-center justify-center rounded-full bg-ink py-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-brand shadow-lg"
              >
                Acquire Artwork • ₹{art.price.toLocaleString('en-IN')}
              </Link>
            )}

            <button
              onClick={() => setShowVisualizer(true)}
              className="flex items-center justify-center gap-2 rounded-full border border-brand/30 bg-brand/[0.06] py-3.5 text-xs font-bold text-brand transition-colors hover:bg-brand/15 hover:border-brand/50 shadow-xs"
            >
              <span>🛋️</span> View on Your Wall (AI Room Visualizer)
            </button>

            <Link
              href={`/artist/${art.artist_id}`}
              className="flex items-center justify-center rounded-full border border-ink/[0.12] py-3 text-xs font-semibold text-ink/70 hover:border-ink/40 hover:text-ink transition-colors"
            >
              Explore more works by {art.artist_name}
            </Link>
          </div>
        </div>
      </div>

      {/* More like this */}
      {similar.length > 0 && (
        <section className="mt-24 border-t border-ink/[0.08] pt-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-brand uppercase">Curated Discovery</p>
              <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl mt-1">Related Pieces</h2>
            </div>
            <Link href="/browse" className="text-xs font-semibold text-ink/60 hover:text-brand transition-colors">
              Explore catalog →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {similar.map((a) => (
              <ArtworkCard key={a.id} artwork={a} />
            ))}
          </div>
        </section>
      )}

      <RoomVisualizerModal
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        artworkId={art.id}
        artworkTitle={art.title}
        artworkImageUrl={art.image_url}
        artworkPrice={art.price}
      />
    </main>
  );
}
