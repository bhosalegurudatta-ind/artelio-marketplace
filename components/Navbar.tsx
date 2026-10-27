'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES } from '@/lib/categories';

type Role = 'artist' | 'customer' | null;

function Mark() {
  // A luminous artist palette with vibrant pigment drops
  return (
    <div className="relative flex items-center justify-center">
      <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden="true" className="drop-shadow-sm">
        {/* Wooden / Ivory Palette body */}
        <path
          d="M2 13C2 6.5 7.5 2 17 2C26.5 2 32 6.5 32 13C32 19 28 24 21 24C18 24 17 22 15 22C13 22 12 24 9 24C4 24 2 18.5 2 13Z"
          fill="#FAF6EE"
          stroke="#E2D9C8"
          strokeWidth="1.5"
        />
        {/* Palette thumb hole */}
        <ellipse cx="26" cy="17" rx="2.5" ry="3" fill="#EADFC9" />
        {/* Vivid Pigments */}
        <circle cx="7" cy="11" r="3" fill="#FF4D36" />
        <circle cx="12" cy="7" r="3" fill="#F59E0B" />
        <circle cx="18" cy="6" r="3" fill="#10B981" />
        <circle cx="24" cy="8" r="3" fill="#2563EB" />
        <circle cx="14" cy="16" r="3" fill="#8B5CF6" />
      </svg>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function SpacesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 12L12 4l9 8v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8z" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setLoggedIn(false);
        setRole(null);
        return;
      }
      setLoggedIn(true);
      const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
      if (active) setRole((profile?.role as Role) ?? null);
    }

    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Deferred so we never call Supabase from inside its own auth callback.
      setTimeout(refresh, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  }

  const actionClass = 'flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink hover:text-brand';

  return (
    <>
      {/* Top strip with rainbow spectrum accent */}
      <div className="bg-[#0F172A] text-xs text-white/80 py-2 relative">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5">
          <p className="truncate tracking-[0.12em] uppercase text-[10px] font-bold flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-vermilion animate-pulse" />
            <span className="font-extrabold text-white tracking-widest">Artelio Atelier</span>
            <span className="text-white/40 hidden sm:inline">|</span>
            <span className="text-white/70 font-medium normal-case tracking-normal hidden sm:inline">Original fine art directly from curated independent artists</span>
          </p>
          <div className="hidden items-center gap-5 sm:flex art-tag text-[10px]">
            <Link href="/plans" className="text-white/75 hover:text-amber transition flex items-center gap-1">
              <span>✦</span> Memberships
            </Link>
            <Link href="/spaces" className="text-white/75 hover:text-cerulean transition">
              Collector Spaces
            </Link>
            <Link href="/artist-signup" className="text-white/75 hover:text-malachite transition">
              Sell your art
            </Link>
            <Link href="/track" className="text-white/75 hover:text-white transition">
              Track order
            </Link>
          </div>
        </div>
        {/* Spectrum line under top strip */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] art-spectrum-line opacity-80" />
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0B0F19]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <Link href="/" className="flex items-center gap-3 group">
            <Mark />
            <div className="flex flex-col">
              <span className="font-serif text-3xl font-bold tracking-tight text-white transition group-hover:text-brand flex items-center gap-1.5">
                Artelio
                <span className="art-tag text-[9px] text-vermilion bg-vermilion/10 px-2 py-0.5 rounded-full border border-vermilion/20">Atelier</span>
              </span>
            </div>
          </Link>

          <form
            onSubmit={handleSearch}
            role="search"
            className="order-3 flex w-full items-center gap-3 rounded-full bg-[#131B2A] border border-white/10 px-4 py-2 transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 focus-within:shadow-md md:order-none md:w-auto md:max-w-xl md:flex-1"
          >
            <span className="text-vermilion"><SearchIcon /></span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search paintings, charcoal drawings, sculptures, prints, or artists..."
              aria-label="Search artworks"
              className="w-full bg-transparent text-xs text-white placeholder:text-white/40 placeholder:italic focus:outline-none font-medium"
            />
          </form>

          <div className="ml-auto flex items-center gap-4">
            {loggedIn ? (
              <>
                {role === 'artist' && (
                  <Link href="/dashboard" className="flex items-center gap-1.5 art-tag text-[11px] text-white/80 hover:text-brand transition">
                    <UserIcon />
                    <span className="hidden sm:inline">Studio</span>
                  </Link>
                )}
                <Link href="/spaces" className="flex items-center gap-1.5 art-tag text-[11px] text-white/80 hover:text-brand transition">
                  <SpacesIcon />
                  <span className="hidden sm:inline">My Spaces</span>
                </Link>
                <Link href="/orders" className="flex items-center gap-1.5 art-tag text-[11px] text-white/80 hover:text-brand transition">
                  <BagIcon />
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                {role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="hidden rounded-full bg-gradient-to-r from-brand to-magenta px-4 py-2 art-tag text-[11px] text-white shadow-md hover:opacity-90 transition md:inline-block"
                  >
                    + Upload Piece
                  </Link>
                )}
                <button onClick={handleLogout} className="art-tag text-[11px] text-white/60 hover:text-clay transition ml-1">
                  Log out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-1.5 art-tag text-[11px] text-white/80 hover:text-brand transition"
                >
                  Log in
                </Link>
                <Link
                  href="/customer-signup"
                  className="rounded-full bg-gradient-to-r from-brand via-purple-600 to-magenta px-5 py-2 art-tag text-[11px] text-white shadow-md shadow-brand/25 hover:shadow-lg hover:scale-105 transition-all"
                >
                  Join Artelio
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category pills */}
      <nav aria-label="Categories" className="border-b border-white/[0.08] bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="no-scrollbar mx-auto flex max-w-[1240px] items-center gap-2.5 overflow-x-auto px-5 py-2.5">
          <Link
            href="/browse"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-4 py-2 art-tag text-[10.5px] text-white shadow-sm hover:opacity-95 transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            All Galleries
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className="shrink-0 rounded-full border border-white/10 bg-[#131B2A] hover:bg-[#1A253A] px-3.5 py-1.5 art-tag text-[10.5px] text-white/80 hover:border-brand/40 hover:text-brand hover:shadow-sm transition"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
