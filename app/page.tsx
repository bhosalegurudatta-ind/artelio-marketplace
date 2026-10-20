'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ArtworkCard, { Artwork, artworkImageStyle } from '@/components/ArtworkCard';
import GenerativeArt from '@/components/GenerativeArt';
import HeroBanner from '@/components/HeroBanner';
import SectionHeader from '@/components/SectionHeader';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES } from '@/lib/categories';

const ARTIST_CARD_PALETTES = [
  { bg: 'bg-[#0E1420]', text: 'text-white', sub: 'text-white/60', link: 'text-white/80' },
  { bg: 'bg-[#F5EFE6]', text: 'text-ink', sub: 'text-ink/60', link: 'text-ink/70' },
  { bg: 'bg-[#EFF6FF]', text: 'text-ink', sub: 'text-ink/60', link: 'text-ink/70' },
];

type ArtistCard = { id: string; name: string; count: number; cover: Artwork };

const TRUST_ITEMS = [
  { icon: '✦', label: '2,000+ original artworks' },
  { icon: '◈', label: 'Direct from artists' },
  { icon: '◎', label: 'AI-powered discovery' },
  { icon: '❋', label: 'Secure payments via Razorpay' },
  { icon: '⟡', label: 'Free artist listings' },
];

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, users(name)')
        .eq('sold', false)
        .order('created_at', { ascending: false })
        .limit(40);

      setArtworks(
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
  }, []);

  const heroPieces = useMemo(() => artworks.filter((a) => a.imageUrl).slice(0, 3), [artworks]);
  const fresh = artworks.slice(0, 5);
  const affordable = useMemo(() => artworks.filter((a) => a.price <= 5000).slice(0, 5), [artworks]);

  // Artists with the most listed work, each shown with their newest piece.
  const artists = useMemo(() => {
    const map = new Map<string, ArtistCard>();
    for (const a of artworks) {
      if (!a.artistId) continue;
      const current = map.get(a.artistId);
      if (!current) {
        map.set(a.artistId, { id: a.artistId, name: a.artist, count: 1, cover: a });
      } else {
        current.count += 1;
        if (!current.cover.imageUrl && a.imageUrl) current.cover = a;
      }
    }
    return Array.from(map.values())
      .sort((x, y) => y.count - x.count)
      .slice(0, 3);
  }, [artworks]);

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8">
      <HeroBanner pieces={heroPieces} />

      {/* Trust bar */}
      <div className="mt-6 flex items-center justify-center gap-0 overflow-hidden rounded-2xl border border-ink/[0.06] bg-white">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex flex-1 items-center justify-center gap-2 border-r border-ink/[0.06] px-3 py-3.5 last:border-r-0"
          >
            <span className="text-brand text-sm" aria-hidden="true">{item.icon}</span>
            <span className="text-[11px] font-semibold text-ink/60 tracking-wide hidden sm:block">{item.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="mt-20 text-center text-ink/40 text-sm">Loading artworks…</p>
      ) : artworks.length === 0 ? (
        <section className="mt-20 rounded-3xl bg-white border border-ink/[0.07] px-8 py-16 text-center shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-ink">Nothing is listed yet</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/60">
            Be the first artist to list a piece. It is free to join, and we only take a commission when your work sells.
          </p>
          <Link
            href="/artist-signup"
            className="mt-8 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-white hover:bg-ink/85 transition-colors"
          >
            Create an artist profile
          </Link>
        </section>
      ) : (
        <>
          {/* Fresh from the studio */}
          <section className="mt-20">
            <SectionHeader before="Fresh from the" highlight="studio" href="/browse" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {fresh.map((art) => (
                <ArtworkCard key={art.id} artwork={art} />
              ))}
            </div>
          </section>

          {/* Shop by medium — horizontal scroll pill cards */}
          <section className="mt-20">
            <SectionHeader before="Shop by" highlight="medium" href="/browse" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/browse?category=${c.slug}`}
                  className="group shrink-0 flex flex-col items-center gap-3"
                >
                  <span className="block h-20 w-20 overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/[0.08] transition-all duration-200 group-hover:ring-2 group-hover:ring-brand group-hover:shadow-md">
                    <GenerativeArt seed={`category-${c.slug}`} className="block h-full w-full transition-transform duration-300 group-hover:scale-105" />
                  </span>
                  <span className="max-w-[90px] text-center text-xs font-semibold text-ink/70 group-hover:text-brand transition-colors">
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Top artists */}
          {artists.length > 0 && (
            <section className="mt-20">
              <SectionHeader before="Featured" highlight="artists" />
              <div className="grid gap-4 md:grid-cols-3">
                {artists.map((artist, i) => {
                  const style = artworkImageStyle(artist.cover);
                  const palette = ARTIST_CARD_PALETTES[i % ARTIST_CARD_PALETTES.length];
                  return (
                    <Link
                      key={artist.id}
                      href={`/artist/${artist.id}`}
                      className={`group flex min-h-[200px] items-center justify-between gap-4 overflow-hidden rounded-3xl p-7 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl ${palette.bg}`}
                    >
                      <div className="min-w-0">
                        <p className={`font-serif truncate text-xl font-bold leading-tight ${palette.text}`}>
                          {artist.name}
                        </p>
                        <p className={`mt-1.5 text-xs tracking-wide ${palette.sub}`}>
                          {artist.count} {artist.count === 1 ? 'artwork' : 'artworks'}
                        </p>
                        <span className={`mt-5 inline-flex items-center gap-1 text-xs font-semibold ${palette.link} transition-gap duration-200`}>
                          View their work <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">→</span>
                        </span>
                      </div>
                      <div className="h-32 w-28 shrink-0 rotate-3 overflow-hidden rounded-2xl bg-white/10 p-1 shadow-2xl transition-transform duration-300 group-hover:rotate-1">
                        <div className="h-full w-full overflow-hidden rounded-xl" style={style ?? undefined}>
                          {!style && <GenerativeArt seed={artist.cover.id} className="block h-full w-full" />}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Under 5,000 */}
          {affordable.length > 0 && (
            <section className="mt-20">
              <SectionHeader before="Original art under" highlight="₹5,000" href="/browse?max=5000" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {affordable.map((art) => (
                  <ArtworkCard key={art.id} artwork={art} />
                ))}
              </div>
            </section>
          )}

          {/* CTA banner */}
          <section className="mt-20">
            <div className="relative overflow-hidden rounded-3xl bg-[#0E1420] px-8 py-12 text-white md:px-14">
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />

              <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-2">For artists</p>
                  <h2 className="font-serif text-2xl font-bold leading-tight md:text-3xl">
                    Sell your work to<br />art lovers across India.
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                    Free to list. No monthly fees. We only earn when you do — 15% on every sale.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/artist-signup"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink hover:bg-white/90 transition-colors shrink-0"
                  >
                    Start selling free
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/80 hover:border-white/40 hover:text-white transition-colors shrink-0"
                  >
                    Explore artworks
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
