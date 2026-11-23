'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ArtworkCard, { Artwork, artworkImageStyle } from '@/components/ArtworkCard';
import HeroBanner from '@/components/HeroBanner';
import LandingPage from '@/components/LandingPage';
import { supabase } from '@/lib/supabaseClient';

// Curated Art Categories (Matching Slide 14 & 21)
const ART_CATEGORIES = [
  { label: 'Customised Sketches', icon: '✏️', href: '/browse?category=customised-sketches', border: 'border-[#F83758]' },
  { label: 'Handcrafted Decor', icon: '✨', href: '/browse?category=crafts', border: 'border-[#FA7189]' },
  { label: 'Sculptures & Metalcraft', icon: '🗿', href: '/browse?category=sculpture', border: 'border-[#4392F9]' },
  { label: 'Paintings', icon: '🎨', href: '/browse?category=paintings', border: 'border-[#8B5CF6]' },
  { label: 'Drawings & Sketches', icon: '📝', href: '/browse?category=drawings', border: 'border-[#EC4899]' },
  { label: 'Digital Art', icon: '💻', href: '/browse?category=digital', border: 'border-[#10B981]' },
];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [guestBrowseMode, setGuestBrowseMode] = useState(false);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

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
          isAiAssisted: Boolean(a.is_ai_assisted),
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
      {/* 1. FINE ART CATEGORIES ROW (Matching Slide 14 & 21) */}
      <div className="no-scrollbar flex items-center justify-start md:justify-between gap-3 overflow-x-auto py-2.5 my-1 px-1">
        {ART_CATEGORIES.map((cat, i) => (
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

      {/* 2. HERO BANNER: "From photo to listing in one click" */}
      <HeroBanner pieces={heroPieces} />

      {/* 3. FEATURED ORIGINAL ARTWORKS (No fake discounts or deal schemes) */}
      <section className="my-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E8E8]">
          <div>
            <h2 className="font-sans text-lg sm:text-xl font-extrabold text-[#17223B]">
              Curated Original Artworks ({artworks.length})
            </h2>
            <p className="text-xs text-[#626262] mt-0.5">
              Original hand-crafted physical works &amp; verified digital editions direct from artist studios.
            </p>
          </div>

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

      {/* 4. AI 3D ROOM TRY-ON BANNER (Virtual Studio) */}
      <section className="my-8 rounded-xl bg-[#17223B] p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="bg-[#4392F9] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
            ✦ AI ROOM STUDIO
          </span>
          <h3 className="font-sans text-lg sm:text-2xl font-bold mt-2">
            See Artworks on Your Own Living Room Walls
          </h3>
          <p className="text-xs text-gray-300 mt-1 max-w-md">
            Preview any painting, craft, or print in true 3D spatial proportion on your wall before ordering.
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
