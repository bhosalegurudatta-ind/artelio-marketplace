'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';

type ArtistProfile = { id: string; name: string; bio: string | null };
type Review = { id: string; rating: number; comment: string | null; created_at: string; reviewer: string };

export default function ArtistPage() {
  const params = useParams();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: artistData } = await supabase.from('users').select('id, name, bio').eq('id', params.id).single();
      setArtist(artistData);

      const { data: rows } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, sold, is_digital')
        .eq('artist_id', params.id)
        .order('created_at', { ascending: false });

      setArtworks(
        (rows ?? [])
          .filter((a: any) => !(a.sold && !a.is_digital))
          .map((a: any) => ({
            id: a.id,
            title: a.title,
            price: a.price,
            medium: a.medium ?? '',
            artist: artistData?.name ?? '',
            imageUrl: a.image_url || null,
            createdAt: a.created_at,
            artistId: String(params.id),
          }))
      );

      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('artist_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const ids = Array.from(new Set((reviewRows ?? []).map((r: any) => r.reviewer_id)));
      const names: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: people } = await supabase.from('users').select('id, name').in('id', ids);
        (people ?? []).forEach((p: any) => (names[p.id] = p.name));
      }
      setReviews(
        (reviewRows ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer: names[r.reviewer_id] ?? 'A buyer',
        }))
      );

      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return <main className="mx-auto max-w-[1240px] px-5 py-20 text-center text-sm text-ink/40">Loading artist profile…</main>;
  if (!artist) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink">Artist Not Found</h2>
        <p className="mt-2 text-sm text-ink/60">This artist profile could not be found.</p>
        <Link href="/browse" className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-ink/80 transition-colors">
          Browse artworks
        </Link>
      </main>
    );
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-12">
      {/* Artist Hero / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C0A36] via-[#43105C] to-[#120726] px-8 py-14 text-white md:px-12 border border-purple-500/25 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-magenta/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-amber/25 blur-3xl" />
        <div className="relative max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-300/30 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-sm">
            <span>🎨</span> Resident Artist Atelier
          </div>

          <h1 className="mt-4 font-serif text-4xl font-bold md:text-6xl drop-shadow-sm">{artist.name}</h1>

          {avg !== null && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
              <span className="text-marigold">★</span>
              <span className="font-bold">{avg.toFixed(1)}</span>
              <span className="text-white/40">({reviews.length} collector {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}

          {artist.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-white/70">{artist.bio}</p>
          ) : (
            <p className="mt-4 text-sm italic text-white/40">Independent artist showcasing original creations on Artelio.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/60">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
              <span className="font-bold text-white text-sm">{artworks.length}</span> Works Available
            </div>
          </div>
        </div>
      </div>

      {/* Works Gallery */}
      <section className="mt-16">
        <div className="mb-8 flex items-end justify-between border-b border-ink/[0.08] pb-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-brand uppercase">Portfolio</p>
            <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl mt-1">Available Pieces</h2>
          </div>
          <span className="text-xs text-ink/40">{artworks.length} pieces</span>
        </div>

        {artworks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center">
            <p className="text-sm font-semibold text-white">No works available currently.</p>
            <p className="mt-1 text-xs text-white/50">Follow this artist or check back soon for their upcoming releases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artworks.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}
      </section>

      {/* Collector Reviews */}
      {reviews.length > 0 && (
        <section className="mt-20 border-t border-ink/[0.08] pt-12">
          <div className="mb-8">
            <p className="text-[11px] font-bold tracking-widest text-brand uppercase">Testimonials</p>
            <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl mt-1">Collector Reviews</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-[#121826] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white">{r.reviewer}</span>
                    <span className="block text-[11px] text-white/40">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-marigold">{'★'.repeat(r.rating)}</span>
                    <span className="text-white/15">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-xs leading-relaxed text-white/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
