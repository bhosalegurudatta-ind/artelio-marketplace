'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('artelio_favorites') || '[]');
      setWishlistCount(favs.length);
    } catch {}

    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data?.user));
    }
    checkAuth();
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E8E8] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="relative grid grid-cols-5 h-16 items-center px-2">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center transition-colors ${
            pathname === '/' ? 'text-[#F83758]' : 'text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname === '/' ? '#F83758' : 'none'} stroke={pathname === '/' ? '#F83758' : 'currentColor'} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className={`text-[10px] mt-1 font-medium ${pathname === '/' ? 'font-bold text-[#F83758]' : ''}`}>
            Home
          </span>
        </Link>

        {/* 2. Wishlist */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center relative transition-colors ${
            pathname === '/orders' ? 'text-[#F83758]' : 'text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#F83758] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">Wishlist</span>
        </Link>

        {/* 3. CENTER FLOATING CART BUTTON (EXACT FIGMA "STYLISH" DESIGN) */}
        <div className="flex items-center justify-center relative">
          <Link
            href="/browse"
            className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F83758] text-white shadow-stylish-float border-4 border-white active:scale-95 transition-transform"
            title="Shop Artworks"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </Link>
        </div>

        {/* 4. Search / Explore */}
        <Link
          href="/browse"
          className={`flex flex-col items-center justify-center transition-colors ${
            pathname === '/browse' ? 'text-[#F83758]' : 'text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] mt-1 font-medium">Search</span>
        </Link>

        {/* 5. Setting / Profile */}
        <Link
          href={loggedIn ? '/profile' : '/login'}
          className={`flex flex-col items-center justify-center transition-colors ${
            pathname === '/profile' || pathname === '/login' || pathname === '/settings'
              ? 'text-[#F83758]'
              : 'text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="text-[10px] mt-1 font-medium">Setting</span>
        </Link>
      </div>
    </nav>
  );
}
