'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ArtworkCard, { Artwork, artworkImageStyle } from '@/components/ArtworkCard';
import HeroBanner from '@/components/HeroBanner';
import LandingPage from '@/components/LandingPage';
import { supabase } from '@/lib/supabaseClient';

// Circular Category Stories matching Screen 9 in Figma UI Kit
const STYLISH_CATEGORIES = [
  { label: 'Beauty', icon: '💄', href: '/browse', border: 'border-[#F83758]' },
  { label: 'Fashion', icon: '👗', href: '/browse?category=paintings', border: 'border-[#FA7189]' },
  { label: 'Kids', icon: '🧸', href: '/browse?category=drawings', border: 'border-[#4392F9]' },
  { label: 'Mens', icon: '👔', href: '/browse?category=prints', border: 'border-[#8B5CF6]' },
  { label: 'Womens', icon: '👠', href: '/browse?category=paintings', border: 'border-[#EC4899]' },
  { label: 'Gifts', icon: '🎁', href: '/browse?category=sculpture', border: 'border-[#F9A825]' },
  { label: 'Decor', icon: '🖼️', href: '/browse?category=digital', border: 'border-[#10B981]' },
];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [guestBrowseMode, setGuestBrowseMode] = useState(false);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Deal of the Day Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 22, minutes: 55, seconds: 20 });

  // 1. Session check: First-time / non-logged in visitors see LandingPage
  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      let { data, error } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, is_hidden, users(name, verified)')
        .eq('sold', false)
        .order('created_at', { ascending: false })
        .limit(40);

      // Fallback if is_hidden or verified column does not exist in db
      if (error || !data) {
        const fallback = await supabase
          .from('artworks')
          .select('id, title, price, medium, image_url, created_at, artist_id, users(name)')
          .eq('sold', false)
          .order('created_at', { ascending: false })
          .limit(40);
        data = fallback.data as any;
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

      // Filter out hidden artworks for public visitors
      const visible = (data ?? []).filter((a: any) => !a.is_hidden);

      // Sort active promoted pieces first
      visible.sort((a: any, b: any) => {
        const aPromoted = activePromoIds.has(a.id);
        const bPromoted = activePromoIds.has(b.id);
        if (aPromoted && !bPromoted) return -1;
        if (!aPromoted && bPromoted) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setArtworks(
        visible.map((a: any) => ({
          id: a.id,
          title: a.title,
          price: a.price,
          medium: a.medium ?? '',
          artist: a.users?.name ?? 'Artelio Artist',
          imageUrl: a.image_url || null,
          createdAt: a.created_at,
          artistId: a.artist_id,
          isPromoted: activePromoIds.has(a.id),
          artistVerified: Boolean(a.users?.verified),
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const heroPieces = useMemo(() => artworks.filter((a) => a.imageUrl).slice(0, 3), [artworks]);
  const dealPieces = useMemo(() => artworks.slice(0, 2), [artworks]);
  const trendingPieces = useMemo(() => artworks.slice(2, 6), [artworks]);
  const allProducts = useMemo(() => artworks.slice(0, 12), [artworks]);

  // Loading skeleton while checking session
  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#F83758] border-r-transparent" />
        <p className="mt-3 text-xs text-[#626262] font-medium">Entering Artelio Studio…</p>
      </div>
    );
  }

  // Non-logged-in first-time visitors see the high-end Everlane-inspired Landing Page
  if (!session && !guestBrowseMode) {
    return <LandingPage onExplore={() => setGuestBrowseMode(true)} />;
  }

  // Logged-in users (or guests who clicked explore) see the full marketplace
  return (
    <div className="mx-auto max-w-[1240px] px-3 sm:px-6 py-2 pb-24 md:pb-12">
      {/* 1. FIGMA CATEGORY AVATARS ROW */}
      <div className="no-scrollbar flex items-center justify-start md:justify-between gap-3 overflow-x-auto py-2.5 my-1 px-1">
        {STYLISH_CATEGORIES.map((cat, i) => (
          <Link
            key={i}
            href={cat.href}
            className="flex flex-col items-center shrink-0 group focus:outline-none"
          >
            <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 ${cat.border} p-0.5 bg-white shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center`}>
              <div className="h-full w-full rounded-full bg-[#F3F3F3] flex items-center justify-center text-xl sm:text-2xl">
                {cat.icon}
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#17223B] mt-1.5 group-hover:text-[#F83758] transition text-center whitespace-nowrap">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>

      {/* 2. FIGMA HERO PROMOTIONAL SLIDER ("50-40% OFF") */}
      <HeroBanner pieces={heroPieces} />

      {/* 3. FIGMA "DEAL OF THE DAY" BLUE BAR WITH COUNTDOWN */}
      <section className="my-6 rounded-xl overflow-hidden bg-white border border-[#E8E8E8] shadow-xs">
        {/* Deal Header in Bright Blue `#4392F9` */}
        <div className="bg-[#4392F9] text-white p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-sans font-extrabold text-base sm:text-lg">
              Deal of the Day
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-0.5 font-mono">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s remaining
              </span>
            </div>
          </div>

          <Link
            href="/browse"
            className="rounded-md bg-[#F83758] hover:bg-[#E02244] text-white text-xs font-bold px-3.5 py-1.5 transition active:scale-95 flex items-center gap-1"
          >
            <span>View all</span>
            <span>→</span>
          </Link>
        </div>

        {/* 2 Horizontal Products as in Figma Screen 9 */}
        <div className="p-4 grid grid-cols-2 gap-3 sm:gap-6">
          {dealPieces.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      </section>

      {/* 4. FIGMA "SPECIAL OFFERS" BANNER (YELLOW/AMBER) */}
      <section className="my-6 rounded-xl bg-[#FFF6E9] border border-[#FEE2C5] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[#F9A825]/20 flex items-center justify-center text-3xl shrink-0">
            ✨
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-base sm:text-lg text-[#17223B]">
              Special Offers ✦ Flat 40% Off
            </h3>
            <p className="text-xs text-[#626262] mt-0.5">
              We make sure you get the offer you need at best prices with signed COA.
            </p>
          </div>
        </div>

        <Link
          href="/browse"
          className="rounded-md bg-[#F9A825] hover:bg-[#E6951A] text-white text-xs font-bold px-5 py-2.5 transition active:scale-95 uppercase tracking-wide shrink-0"
        >
          Visit Now →
        </Link>
      </section>

      {/* 5. FIGMA "TRENDING PRODUCTS" CORAL BANNER & GRID */}
      <section className="my-6 rounded-xl overflow-hidden bg-white border border-[#E8E8E8] shadow-xs">
        {/* Header in Coral Red `#F83758` */}
        <div className="bg-[#FD6E87] text-white p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-sans font-extrabold text-base sm:text-lg">
              Trending Products
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-0.5">
              <span>📅 Last Date 29/02/26 • Authentic Original Creations</span>
            </div>
          </div>

          <Link
            href="/browse"
            className="rounded-md bg-white text-[#F83758] hover:bg-[#FDF0F3] text-xs font-bold px-3.5 py-1.5 transition active:scale-95 flex items-center gap-1"
          >
            <span>View all</span>
            <span>→</span>
          </Link>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {trendingPieces.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      </section>

      {/* 6. FIGMA "HOT SUMMER / FESTIVE SALE" BANNER */}
      <section className="my-6 rounded-2xl bg-gradient-to-r from-[#F83758] to-[#FA7189] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-stylish-btn">
        <div>
          <span className="bg-white text-[#F83758] text-[10px] font-black uppercase px-2 py-0.5 rounded">
            LIMITED TIME FESTIVAL
          </span>
          <h2 className="font-sans text-xl sm:text-3xl font-extrabold mt-2">
            New Arrivals &amp; Curated Ateliers
          </h2>
          <p className="text-xs text-white/90 mt-1 max-w-lg">
            Summer’26 Collections • Discover hand-painted canvas originals, sketches, and modern digital art.
          </p>
        </div>

        <Link
          href="/browse"
          className="rounded-md bg-white text-[#F83758] hover:bg-[#FDF0F3] text-xs font-bold px-6 py-2.5 transition uppercase tracking-wide shrink-0 shadow-md"
        >
          Explore All Artworks →
        </Link>
      </section>

      {/* 7. FIGMA MAIN PRODUCT CATALOG GRID (2-COLUMN ON MOBILE) */}
      <section className="my-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E8E8]">
          <h2 className="font-sans text-lg sm:text-xl font-extrabold text-[#17223B]">
            All Featured Artworks ({artworks.length})
          </h2>

          <Link href="/browse" className="text-xs font-bold text-[#F83758] hover:underline">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-gray-200 bg-white p-3 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
                <div className="h-6 bg-gray-200 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {allProducts.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}
      </section>

      {/* 8. AI 3D ROOM TRY-ON BANNER (Virtual Studio) */}
      <section className="my-8 rounded-xl bg-[#17223B] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="bg-[#4392F9] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
            ✦ AI ROOM STUDIO
          </span>
          <h3 className="font-sans text-lg sm:text-2xl font-bold mt-2">
            See Artworks on Your Own Living Room Walls
          </h3>
          <p className="text-xs text-gray-300 mt-1 max-w-md">
            Preview any painting or print in true 3D spatial proportion on your wall before ordering.
          </p>
        </div>

        <Link
          href="/spaces"
          className="rounded-md bg-[#F83758] hover:bg-[#E02244] text-white text-xs font-bold px-6 py-2.5 transition active:scale-95 shrink-0 shadow-stylish-btn"
        >
          Try 3D Room Visualizer →
        </Link>
      </section>
    </div>
  );
}
