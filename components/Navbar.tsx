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
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setLoggedIn(false);
        setRole(null);
        setUserName('');
        setUserEmail('');
        return;
      }
      setLoggedIn(true);
      setUserEmail(data.user.email || '');

      let { data: profile } = await supabase.from('users').select('name, role').eq('id', data.user.id).maybeSingle();
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
        } catch {}
      }
      if (active) {
        setRole((profile?.role as Role) ?? null);
        setUserName(profile?.name || (data.user.email ? data.user.email.split('@')[0] : 'Member'));
      }
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
    setMenuOpen(false);
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
      {/* 1. TOP PROMO RIBBON (Matching Artelio Grand Art Utsav Banner) */}
      <div className="bg-[#FA1E78] text-white py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2.5 flex-wrap shadow-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-white/20 border border-white/25 px-2.5 py-0.5 text-[10.5px] sm:text-[11.5px] font-extrabold text-white shadow-xs tracking-wider">
          ✦ ARTELIO GRAND ART UTSAV
        </span>
        <span className="text-[11px] sm:text-xs font-bold text-white drop-shadow-xs">
          Get Up to 40% Off on Curated Originals + Free Insured White-Glove Courier Delivery Across India!
        </span>
      </div>

      {/* 2. FIGMA "STYLISH" APP HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E8]">
        <div className="mx-auto max-w-[1240px] px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
          
          {/* Left: Hamburger Menu Icon */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[#17223B] hover:bg-[#F3F3F3] transition"
            aria-label="Open navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="16" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Center: "Stylish" Swirl Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* The iconic Figma circle with blue and coral swirl */}
            <div className="relative h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#4392F9] via-[#FA7189] to-[#F83758] shadow-sm p-1">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-[#F83758]" />
              </div>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#4392F9] font-sans group-hover:opacity-90 transition">
              <span className="text-[#4392F9]">Art</span>
              <span className="text-[#F83758]">elio</span>
            </span>
          </Link>

          {/* Right: User Avatar Photo Circle (Matching Figma screen) */}
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <div className="flex items-center gap-2">
                {role === 'artist' && (
                  <Link
                    href="/dashboard/upload"
                    className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#F83758] hover:bg-[#E02244] px-3 py-1.5 text-xs font-bold text-white shadow-stylish-btn transition active:scale-95"
                  >
                    <span>+ Upload Art</span>
                  </Link>
                )}

                {userEmail === 'bhosalegurudatta@gmail.com' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 rounded bg-[#FDF0F3] border border-[#F83758]/30 px-2 py-1 text-[11px] font-bold text-[#F83758] hover:bg-[#F83758] hover:text-white transition"
                  >
                    <span>👑 Admin</span>
                  </Link>
                )}

                <Link href="/profile" className="flex items-center gap-1.5 group" title="My Profile">
                  <div className="h-9 w-9 rounded-full bg-[#FDF0F3] border-2 border-[#F83758] flex items-center justify-center font-bold text-[#F83758] text-sm overflow-hidden shadow-xs">
                    {userName ? userName[0].toUpperCase() : 'U'}
                  </div>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[#F83758] hover:bg-[#E02244] px-5 py-2 text-xs font-bold text-white shadow-stylish-btn transition active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* 3. FIGMA SEARCH BAR WITH MIC ICON */}
        <div className="mx-auto max-w-[1240px] px-4 pb-3 sm:px-6">
          <form onSubmit={handleSearch} className="relative flex items-center">
            {/* Search Magnifying Glass Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A8A8A9"
              strokeWidth="2.5"
              className="absolute left-4 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>

            {/* Input with exact Figma styling: rounded, #F3F3F3 background */}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any Product.."
              className="w-full rounded-xl border border-transparent bg-[#F3F3F3] hover:bg-white hover:border-[#DEDBDB] focus:bg-white focus:border-[#F83758] pl-11 pr-11 py-2.5 text-sm text-[#17223B] placeholder-[#A8A8A9] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition shadow-xs"
            />

            {/* Microphone Icon (from Figma design) */}
            <button
              type="button"
              onClick={() => alert('Voice search ready: Try searching for "Oil Painting" or "Charcoal"')}
              className="absolute right-3.5 p-1 text-[#A8A8A9] hover:text-[#F83758] transition"
              title="Voice Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </form>

          {/* 4. FIGMA "All Featured" Sort & Filter Row */}
          <div className="flex items-center justify-between mt-2 pt-1">
            <h2 className="text-sm font-extrabold text-[#17223B] tracking-tight">
              All Featured
            </h2>

            <div className="flex items-center gap-2">
              <Link
                href="/browse"
                className="flex items-center gap-1 bg-white border border-[#DEDBDB] px-3 py-1 rounded-md text-xs font-semibold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] transition shadow-xs"
              >
                <span>Sort</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 15l5 5 5-5" />
                  <path d="M7 9l5-5 5 5" />
                </svg>
              </Link>

              <Link
                href="/browse"
                className="flex items-center gap-1 bg-white border border-[#DEDBDB] px-3 py-1 rounded-md text-xs font-semibold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] transition shadow-xs"
              >
                <span>Filter</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 5. Mobile Drawer Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex" onClick={() => setMenuOpen(false)}>
            <div className="w-72 bg-white h-full p-6 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <span className="font-extrabold text-xl text-[#F83758]">Artelio Menu</span>
                  <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-black">✕</button>
                </div>

                <div className="mt-4 space-y-3">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    🏠 Home
                  </Link>
                  <Link href="/browse" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    🎨 All Artworks
                  </Link>
                  <Link href="/spaces" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    ✨ 3D Room Visualizer
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    📦 My Orders
                  </Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    👤 Account Profile
                  </Link>
                  <Link href="/track" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#17223B] hover:text-[#F83758]">
                    🚚 Track Delivery
                  </Link>
                  <Link href="/artist-signup" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-bold text-[#4392F9] hover:underline">
                    🖌️ Sell Art on Artelio
                  </Link>
                </div>
              </div>

              {loggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition"
                >
                  Log Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-[#F83758] text-white font-bold text-xs text-center block shadow-stylish-btn"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
