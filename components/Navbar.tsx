'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES } from '@/lib/categories';

type Role = 'artist' | 'customer' | null;

export default function Navbar() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [query, setQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setLoggedIn(false);
        setRole(null);
        setUserEmail('');
        return;
      }
      setLoggedIn(true);
      setUserEmail(data.user.email || '');
      let { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
      if (!profile) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.access_token) {
            const syncRes = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionData.session.access_token}`,
              },
            });
            const syncJson = await syncRes.json().catch(() => ({}));
            profile = syncJson?.profile || null;
          }
        } catch {
          // ignore
        }
      }
      if (active) setRole((profile?.role as Role) ?? null);
    }

    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
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

  return (
    <>
      {/* 1. NYKAA TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#FC2779] text-white text-[11px] font-semibold tracking-wide py-1.5 px-4">
        <div className="mx-auto max-w-[1280px] flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
              ✦ ARTELIO GRAND ART UTSAV
            </span>
            <span className="hidden sm:inline">
              Get Up to 40% Off on Curated Originals + Free Insured White-Glove Courier Delivery Across India!
            </span>
            <span className="sm:hidden">Grand Art Sale • Free All-India Delivery</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-white/90">
            <Link href="/track" className="hover:text-white transition hidden md:inline">
              🚚 Track Order
            </Link>
            <span className="hidden md:inline">|</span>
            <Link href="/contact" className="hover:text-white transition hidden sm:inline">
              Help &amp; Concierge
            </Link>
            <span>|</span>
            <Link href="/artist-signup" className="text-white font-bold hover:underline">
              Sell on Artelio
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NYKAA MAIN HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E8] shadow-xs">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group shrink-0">
            <span className="font-extrabold text-2xl sm:text-3xl tracking-tighter text-[#1A1A1A] group-hover:text-[#FC2779] transition font-sans">
              ARTELIO
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-[#FC2779] bg-[#FFF0F5] px-1.5 py-0.5 rounded uppercase border border-[#FC2779]/20">
              LUXE
            </span>
          </Link>

          {/* Quick Hub Links (Beauty/Fashion style) */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-[#333333] ml-4">
            <Link href="/browse" className="hover:text-[#FC2779] transition pb-0.5 border-b-2 border-transparent hover:border-[#FC2779]">
              Galleries
            </Link>
            <Link href="/browse?category=paintings" className="hover:text-[#FC2779] transition pb-0.5 border-b-2 border-transparent hover:border-[#FC2779]">
              Paintings
            </Link>
            <Link href="/spaces" className="hover:text-[#FC2779] transition pb-0.5 border-b-2 border-transparent hover:border-[#FC2779] text-[#FC2779]">
              ✨ 3D Room Studio
            </Link>
          </div>

          {/* Nykaa Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto relative hidden md:block">
            <div className="relative flex items-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#888888"
                strokeWidth="2.5"
                className="absolute left-3.5 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search on Artelio: Paintings, Charcoal, Canvas, Artists, Sculptures..."
                className="w-full rounded-md border border-[#E0E0E0] bg-[#F5F5F6] hover:bg-white focus:bg-white pl-10 pr-4 py-2 text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#FC2779] focus:outline-none focus:ring-1 focus:ring-[#FC2779] transition-all"
              />
            </div>
          </form>

          {/* Right Action Icons: Nykaa Style */}
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            {loggedIn ? (
              <>
                <Link
                  href="/profile"
                  className="flex flex-col items-center justify-center text-[#333333] hover:text-[#FC2779] transition group"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] font-bold mt-0.5 tracking-tight">Account</span>
                </Link>

                <Link
                  href="/orders"
                  className="flex flex-col items-center justify-center text-[#333333] hover:text-[#FC2779] transition group"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span className="text-[10px] font-bold mt-0.5 tracking-tight">Orders</span>
                </Link>

                {role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#FC2779] hover:bg-[#D81B60] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                  >
                    <span>+ Upload Art</span>
                  </Link>
                )}

                {userEmail === 'bhosalegurudatta@gmail.com' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 rounded bg-[#FFF0F5] border border-[#FC2779]/30 px-2 py-1 text-[11px] font-bold text-[#FC2779] hover:bg-[#FC2779] hover:text-white transition"
                  >
                    <span>👑 Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-gray-500 hover:text-[#FC2779] transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-md bg-[#FC2779] hover:bg-[#D81B60] px-5 py-2 text-xs font-bold text-white shadow-nykaa-pink transition active:scale-95 flex items-center gap-1.5"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
                  </svg>
                  <span>Sign in</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3. NYKAA MEGAMENU CATEGORY STRIP */}
        <nav aria-label="Categories" className="border-t border-[#F0F0F0] bg-white">
          <div className="no-scrollbar mx-auto flex max-w-[1280px] items-center justify-between gap-1 overflow-x-auto px-4 py-2">
            <Link
              href="/browse"
              className="shrink-0 px-3 py-1 text-xs font-extrabold uppercase text-[#FC2779] hover:bg-[#FFF0F5] rounded transition"
            >
              All Artworks
            </Link>

            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/browse?category=${c.slug}`}
                className="shrink-0 px-3 py-1 text-xs font-semibold uppercase text-[#333333] hover:text-[#FC2779] hover:bg-[#FFF0F5] rounded transition tracking-tight whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}

            <Link
              href="/plans"
              className="shrink-0 px-3 py-1 text-xs font-extrabold uppercase text-[#C5A059] bg-[#FFFBF0] border border-[#C5A059]/30 rounded hover:bg-[#C5A059] hover:text-white transition tracking-wide"
            >
              ✦ Artelio Luxe
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
