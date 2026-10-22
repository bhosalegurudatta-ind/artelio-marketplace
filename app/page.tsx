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
  {
    bg: 'bg-gradient-to-br from-[#1E0B38] via-[#3F146B] to-[#120724] border border-purple-500/30 shadow-lg',
    text: 'text-white',
    sub: 'text-purple-200/75',
    link: 'text-amber-300 hover:text-amber-200',
    tag: 'bg-purple-500/25 text-purple-200 border-purple-400/30',
    badge: '✦ Atelier Spotlight',
  },
  {
    bg: 'bg-gradient-to-br from-[#330C1D] via-[#631834] to-[#1F0712] border border-rose-500/30 shadow-lg',
    text: 'text-white',
    sub: 'text-rose-200/75',
    link: 'text-rose-300 hover:text-rose-200',
    tag: 'bg-rose-500/25 text-rose-200 border-rose-400/30',
    badge: '🎨 Master Painter',
  },
  {
    bg: 'bg-gradient-to-br from-[#08233D] via-[#10486D] to-[#051A2E] border border-cyan-500/30 shadow-lg',
    text: 'text-white',
    sub: 'text-cyan-200/75',
    link: 'text-cyan-300 hover:text-cyan-200',
    tag: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/30',
    badge: '🏛️ Modern Visionary',
  },
];

type ArtistCard = { id: string; name: string; count: number; cover: Artwork };

const TRUST_ITEMS = [
  { icon: '🎨', color: 'bg-rose-50 text-vermilion border-rose-200/60', label: '2,000+ Original Artworks' },
  { icon: '✨', color: 'bg-amber-50 text-amber border-amber-200/60', label: 'Direct from Artist Ateliers' },
  { icon: '🔮', color: 'bg-purple-50 text-amethyst border-purple-200/60', label: 'AI Spatial Room Visualization' },
  { icon: '🛡️', color: 'bg-emerald-50 text-malachite border-emerald-200/60', label: 'Protected Razorpay Payments' },
  { icon: '✦', color: 'bg-sky-50 text-cerulean border-sky-200/60', label: 'Zero Upfront Artist Fees' },
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

      {/* Trust bar with colourful artistic micro-badges */}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 shadow-sm transition-all hover:scale-[1.02] ${item.color} bg-white`}
          >
            <span className="text-base" aria-hidden="true">{item.icon}</span>
            <span className="text-xs font-bold text-ink/80 tracking-tight leading-tight">{item.label}</span>
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
            <SectionHeader before="Explore by" highlight="Artistic Medium" href="/browse" />
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/browse?category=${c.slug}`}
                  className="group shrink-0 flex flex-col items-center gap-2.5 p-2 rounded-2xl hover:bg-white/60 transition-all"
                >
                  <span className="relative block h-24 w-24 overflow-hidden rounded-2xl bg-white p-1 ring-2 ring-black/[0.08] shadow-sm transition-all duration-300 group-hover:ring-4 group-hover:ring-brand/40 group-hover:shadow-art-card group-hover:-translate-y-1">
                    <div className="h-full w-full overflow-hidden rounded-xl">
                      <GenerativeArt seed={`category-${c.slug}`} className="block h-full w-full transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  </span>
                  <span className="max-w-[100px] text-center text-xs font-bold text-ink/80 group-hover:text-brand transition-colors">
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Top artists */}
          {artists.length > 0 && (
            <section className="mt-20">
              <SectionHeader before="Curated" highlight="Artist Ateliers" />
              <div className="grid gap-5 md:grid-cols-3">
                {artists.map((artist, i) => {
                  const style = artworkImageStyle(artist.cover);
                  const palette = ARTIST_CARD_PALETTES[i % ARTIST_CARD_PALETTES.length];
                  return (
                    <Link
                      key={artist.id}
                      href={`/artist/${artist.id}`}
                      className={`group relative flex min-h-[220px] items-center justify-between gap-4 overflow-hidden rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${palette.bg}`}
                    >
                      <div className="min-w-0 z-10">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-3 ${palette.tag}`}>
                          {palette.badge}
                        </span>
                        <p className={`font-serif truncate text-2xl font-black leading-tight ${palette.text}`}>
                          {artist.name}
                        </p>
                        <p className={`mt-1.5 text-xs tracking-wide font-medium ${palette.sub}`}>
                          {artist.count} {artist.count === 1 ? 'artwork listed' : 'artworks listed'}
                        </p>
                        <span className={`mt-5 inline-flex items-center gap-1.5 text-xs font-bold ${palette.link} transition-all`}>
                          Visit Studio Atelier <span className="translate-x-0 group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                        </span>
                      </div>
                      <div className="h-36 w-32 shrink-0 rotate-3 overflow-hidden rounded-2xl bg-white/20 p-1.5 shadow-2xl ring-2 ring-white/30 backdrop-blur-md transition-all duration-500 group-hover:rotate-0 group-hover:scale-105 z-10">
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
              <SectionHeader before="Accessible Originals under" highlight="₹5,000" href="/browse?max=5000" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {affordable.map((art) => (
                  <ArtworkCard key={art.id} artwork={art} />
                ))}
              </div>
            </section>
          )}

          {/* CTA banner with vivid artistic background */}
          <section className="mt-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170B28] via-[#350F52] to-[#120729] px-8 py-14 text-white md:px-14 border border-purple-500/20 shadow-2xl">
              {/* Decorative vibrant colorful radiant blooms */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-magenta/30 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-vermilion/25 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-96 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />

              <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-block rounded-full bg-amber-400/20 border border-amber-300/30 px-3 py-1 text-[11px] font-bold tracking-widest text-amber-300 uppercase mb-3">
                    🎨 Calling All Creators
                  </span>
                  <h2 className="font-serif text-3xl font-black leading-tight md:text-4xl">
                    Exhibit your artwork to<br />discerning collectors across India.
                  </h2>
                  <p className="mt-3.5 max-w-lg text-sm leading-relaxed text-white/80 font-light">
                    Join 1,000+ independent artists. Zero listing fees, AI catalog assistance, automatic certificates of authenticity, and 85% payouts directly to your bank account.
                  </p>
                </div>
                <div className="flex flex-col gap-3.5 sm:flex-row shrink-0">
                  <Link
                    href="/artist-signup"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-vermilion to-amber-400 px-8 py-4 text-sm font-extrabold text-ink shadow-gold-glow hover:scale-105 transition-all shrink-0"
                  >
                    Open Your Studio Free →
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-7 py-4 text-sm font-bold text-white hover:bg-white/20 transition-all shrink-0"
                  >
                    Explore Artworks
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
