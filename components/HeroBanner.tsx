'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Artwork, artworkImageStyle } from './ArtworkCard';

const SLIDES = [
  {
    bg: 'bg-gradient-to-r from-[#FC2779] via-[#D81B60] to-[#880E4F]',
    tag: 'GRAND FESTIVE ART SALE',
    tagClass: 'bg-white text-[#FC2779] font-black',
    title: 'India’s Curated Original Art Collection',
    sub: 'Up to 35% Off on Authentic Canvas Paintings, Charcoal Drawings & Watercolors directly from certified Indian artists.',
    cta: 'Shop Now',
    href: '/browse',
    badge: '100% Certified Originals',
  },
  {
    bg: 'bg-gradient-to-r from-[#1A1A1A] via-[#2A1B28] to-[#FC2779]',
    tag: 'ARTELIO LUXE COLLECTION',
    tagClass: 'bg-[#C5A059] text-white font-black',
    title: 'Masterpiece Oils & Sculptures',
    sub: 'Exquisite investment-grade artworks accompanied by signed physical Certificates of Authenticity.',
    cta: 'Explore Luxe Gallery',
    href: '/browse?category=paintings',
    badge: 'Free Insured White-Glove Shipping',
  },
  {
    bg: 'bg-gradient-to-r from-[#003B46] via-[#07575B] to-[#66A5AD]',
    tag: 'AI LIVING ROOM STUDIO',
    tagClass: 'bg-white text-[#003B46] font-black',
    title: 'Visualize Art On Your Walls in 4K',
    sub: 'Upload photos of your living room, bedroom, or office to see exact wall scale and palette harmony before you buy.',
    cta: 'Try 3D Room Studio',
    href: '/spaces',
    badge: 'Instant Augmented Reality Preview',
  },
];

export default function HeroBanner({ pieces }: { pieces: Artwork[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-nykaa-card my-4">
      <div className={`relative min-h-[340px] sm:min-h-[400px] flex items-center justify-between p-8 sm:p-14 text-white transition-all duration-700 ${slide.bg}`}>
        
        {/* Left Content */}
        <div className="max-w-xl z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-wider mb-4 shadow-xs">
            <span className={`px-2.5 py-0.5 rounded text-[10px] ${slide.tagClass}`}>
              {slide.tag}
            </span>
            <span className="text-white/90 font-medium hidden sm:inline">
              ✦ {slide.badge}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
            {slide.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed font-normal">
            {slide.sub}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className="rounded-md bg-white text-[#FC2779] hover:bg-[#FFF0F5] px-7 py-3 text-xs sm:text-sm font-extrabold shadow-lg transition active:scale-95 uppercase tracking-wide"
            >
              {slide.cta} →
            </Link>

            <Link
              href="/plans"
              className="rounded-md border border-white/40 bg-white/10 hover:bg-white/20 px-5 py-3 text-xs sm:text-sm font-bold text-white transition backdrop-blur-xs"
            >
              Join Art VIP Club
            </Link>
          </div>
        </div>

        {/* Right Art Highlights Floating Carousel Ticker */}
        <div className="hidden lg:flex items-center gap-4 z-10 shrink-0">
          {pieces.slice(0, 2).map((piece, i) => (
            <Link
              key={piece.id || i}
              href={`/artwork/${piece.id}`}
              className="w-44 rounded-xl bg-white p-2.5 shadow-2xl transition hover:-translate-y-1.5 duration-300 block text-[#1A1A1A]"
            >
              <div
                className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative"
                style={artworkImageStyle(piece) ?? undefined}
              >
                {!piece.imageUrl && (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                )}
                <span className="absolute top-2 left-2 bg-[#FC2779] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  Featured
                </span>
              </div>
              <h3 className="font-bold text-xs truncate mt-2 text-[#1A1A1A]">{piece.title}</h3>
              <p className="text-[10px] text-gray-500 truncate">{piece.artist}</p>
              <p className="text-xs font-black text-[#FC2779] mt-1">₹{piece.price?.toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
