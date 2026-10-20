'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES } from '@/lib/categories';

type Role = 'artist' | 'customer' | null;

function Mark() {
  // Three overlapping circles, a nod to mixing paint.
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true" style={{ mixBlendMode: 'multiply' }}>
      <circle cx="10" cy="10" r="8" fill="#F4B63D" />
      <circle cx="17" cy="10" r="8" fill="#E4452C" fillOpacity="0.85" />
      <circle cx="22" cy="10" r="7" fill="#0E8ACF" fillOpacity="0.85" />
    </svg>
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
      {/* Top strip */}
      <div className="bg-[#121926] text-xs text-white/70 py-2 border-b border-white/5">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5">
          <p className="truncate tracking-wide">
            ✦ Artelio • Original fine art directly from independent creators
          </p>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="/plans" className="hover:text-white transition">Pricing &amp; Plans</Link>
            <Link href="/spaces" className="hover:text-white transition">Collector Spaces</Link>
            <Link href="/artist-signup" className="hover:text-white transition">Sell your art</Link>
            <Link href="/orders" className="hover:text-white transition">Track order</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Mark />
            <span className="font-serif text-2xl font-bold tracking-tight text-ink transition group-hover:text-brand">
              Artelio
            </span>
          </Link>

          <form
            onSubmit={handleSearch}
            role="search"
            className="order-3 flex w-full items-center gap-3 rounded-full bg-paper/80 border border-ink/5 px-4 py-2 transition-all focus-within:border-brand/40 focus-within:bg-white focus-within:shadow-sm md:order-none md:w-auto md:max-w-xl md:flex-1"
          >
            <span className="text-ink/40"><SearchIcon /></span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search original paintings, drawings, prints, or artists..."
              aria-label="Search artworks"
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </form>

          <div className="ml-auto flex items-center gap-4">
            {loggedIn ? (
              <>
                {role === 'artist' && (
                  <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-semibold text-ink/80 hover:text-brand transition">
                    <UserIcon />
                    <span className="hidden sm:inline">Studio</span>
                  </Link>
                )}
                <Link href="/spaces" className="flex items-center gap-1.5 text-xs font-semibold text-ink/80 hover:text-brand transition">
                  <SpacesIcon />
                  <span className="hidden sm:inline">My Spaces</span>
                </Link>
                <Link href="/orders" className="flex items-center gap-1.5 text-xs font-semibold text-ink/80 hover:text-brand transition">
                  <BagIcon />
                  <span className="hidden sm:inline">Orders</span>
                </Link>
                {role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="hidden rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-dark transition md:inline-block"
                  >
                    + Upload Piece
                  </Link>
                )}
                <button onClick={handleLogout} className="text-xs font-semibold text-ink/60 hover:text-clay transition ml-1">
                  Log out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-ink hover:text-brand transition"
                >
                  Log in
                </Link>
                <Link
                  href="/customer-signup"
                  className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
                >
                  Join Artelio
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category pills */}
      <nav aria-label="Categories" className="border-b border-ink/10 bg-white">
        <div className="no-scrollbar mx-auto flex max-w-[1200px] items-center gap-3 overflow-x-auto px-5 py-3">
          <Link
            href="/browse"
            className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            All categories
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/browse?category=${c.slug}`}
              className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink/80 hover:border-brand hover:text-brand"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
