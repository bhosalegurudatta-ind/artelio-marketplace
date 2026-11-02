'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import HeroBanner from '@/components/HeroBanner';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES } from '@/lib/categories';

const NYKAA_TRUST_STRIP = [
  { icon: '✨', title: '100% Certified Originals', desc: 'Direct from vetted master artist ateliers' },
  { icon: '📜', title: 'Signed Certificate (COA)', desc: 'Tamper-proof physical provenance document' },
  { icon: '🚚', title: 'Insured White-Glove Shipping', desc: 'Custom crate packaging with live GPS courier tracking' },
  { icon: '🛡️', title: 'Razorpay Escrow Protected', desc: 'Money held safely until delivery is confirmed' },
];

const POPULAR_MEDIUM_ICONS = [
  { label: 'Oil on Canvas', slug: 'paintings', icon: '🎨', bg: 'bg-[#FFF0F5] text-[#FC2779]' },
  { label: 'Charcoal & Sketches', slug: 'drawings', icon: '✏️', bg: 'bg-[#F3E5F5] text-[#7B1FA2]' },
  { label: 'Watercolour', slug: 'paintings', icon: '🖌️', bg: 'bg-[#E1F5FE] text-[#0288D1]' },
  { label: 'Digital Masterworks', slug: 'digital', icon: '💻', bg: 'bg-[#E8F5E9] text-[#2E7D32]' },
  { label: 'Sculptures & Ceramics', slug: 'sculpture', icon: '🗿', bg: 'bg-[#FFF8E1] text-[#F57F17]' },
  { label: 'Fine Art Prints', slug: 'prints', icon: '🖼️', bg: 'bg-[#FBE9E7] text-[#D84315]' },
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
          artist: a.users?.name ?? 'Artelio Atelier Artist',
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
  const trendingPieces = useMemo(() => artworks.slice(0, 8), [artworks]);
  const curatedLuxePieces = useMemo(() => artworks.filter((a) => Number(a.price) >= 3000).slice(0, 4), [artworks]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">
      {/* 1. NYKAA HERO CAROUSEL */}
      <HeroBanner pieces={heroPieces} />

      {/* 2. NYKAA TRUST & ASSURANCE STRIP */}
      <div className="my-6 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#E8E8E8] shadow-xs">
        {NYKAA_TRUST_STRIP.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-2 border-r last:border-r-0 border-gray-100">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className="text-xs font-bold text-[#1A1A1A]">{item.title}</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SHOP BY MEDIUM / CATEGORY ROUNDED PILLS (NYKAA STYLE) */}
      <div className="my-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Shop by Medium &amp; Style
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Explore authentic creations categorized by Indian master artistic styles</p>
          </div>
          <Link href="/browse" className="text-xs font-bold text-[#FC2779] hover:underline">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {POPULAR_MEDIUM_ICONS.map((med, idx) => (
            <Link
              key={idx}
              href={`/browse?category=${med.slug}`}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-[#E8E8E8] hover:border-[#FC2779] shadow-xs hover:shadow-nykaa-hover transition-all text-center group"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl mb-2 transition group-hover:scale-110 ${med.bg}`}>
                {med.icon}
              </div>
              <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#FC2779] transition">
                {med.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. NYKAA PROMOTIONAL FLASH BANNER STRIP */}
      <div className="my-8 rounded-2xl bg-gradient-to-r from-[#FC2779] via-[#D81B60] to-[#E91E63] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-nykaa-pink">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0">
            🎨
          </div>
          <div>
            <span className="bg-white text-[#FC2779] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              ✦ LIMITED ATELIER DROP
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-extrabold mt-1">
              Curated Masterworks: Indian Contemporary Originals
            </h3>
            <p className="text-xs text-white/90">
              Each piece is one-of-a-kind, signed by the artist, and shipped with free custom museum packaging.
            </p>
          </div>
        </div>

        <Link
          href="/browse"
          className="rounded-lg bg-white hover:bg-[#FFF0F5] text-[#FC2779] font-extrabold px-6 py-2.5 text-xs shadow-md transition active:scale-95 shrink-0 uppercase tracking-wide"
        >
          Explore Collection →
        </Link>
      </div>

      {/* 5. TRENDING ARTWORKS GRID (NYKAA BEAUTY E-COMMERCE CARDS) */}
      <section className="my-10">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1.5 rounded-full bg-[#FC2779]" />
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Trending Original Artworks
            </h2>
            <span className="rounded-full bg-[#FFF0F5] text-[#FC2779] px-2.5 py-0.5 text-[11px] font-black border border-[#FC2779]/20 hidden sm:inline">
              HOT PICKS
            </span>
          </div>

          <Link href="/browse" className="text-xs font-bold text-[#FC2779] hover:underline">
            View All ({artworks.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
                <div className="h-6 bg-gray-200 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {trendingPieces.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}
      </section>

      {/* 6. NYKAA LUXE SECTION (HIGH TICKET / MASTERWORKS) */}
      {curatedLuxePieces.length > 0 && (
        <section className="my-12 rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-white p-6 sm:p-8 border border-[#E5C384]/40 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5C384]/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#C5A059] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                  ✦ ARTELIO LUXE
                </span>
                <span className="text-xs font-bold text-[#C5A059]">INVESTMENT-GRADE ORIGINAL FINE ART</span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-[#1A1A1A] mt-1">
                The Collector’s Salon
              </h2>
            </div>
            <Link
              href="/browse"
              className="self-start sm:self-auto rounded-md bg-[#C5A059] hover:bg-[#B38F48] text-white px-5 py-2 text-xs font-bold shadow-xs transition"
            >
              Discover Luxe Pieces →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {curatedLuxePieces.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        </section>
      )}

      {/* 7. AI 3D ROOM VISUALIZER BANNER (NYKAA STYLE TRY-ON) */}
      <section className="my-12 rounded-2xl bg-[#1A1A1A] p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="max-w-xl z-10">
          <span className="bg-[#FC2779] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded">
            ✦ VIRTUAL TRY-ON ON YOUR WALLS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold mt-3">
            Preview Paintings in Your Room in 3D
          </h2>
          <p className="text-sm text-gray-300 mt-2 leading-relaxed">
            Unsure of the painting size or colors? Use Artelio’s AI Interior Stylist to project artworks onto your living room or office walls with true real-world scaling before buying.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/spaces"
              className="rounded-md bg-[#FC2779] hover:bg-[#D81B60] text-white px-6 py-2.5 text-xs font-bold shadow-nykaa-pink transition active:scale-95"
            >
              Launch 3D Room Studio →
            </Link>
            <Link
              href="/plans"
              className="rounded-md border border-white/20 hover:bg-white/10 text-white px-5 py-2.5 text-xs font-bold transition"
            >
              Collector Benefits
            </Link>
          </div>
        </div>

        <div className="h-44 w-44 rounded-full bg-gradient-to-tr from-[#FC2779]/40 to-[#C5A059]/30 blur-2xl pointer-events-none absolute right-10 top-10" />
      </section>
    </div>
  );
}
