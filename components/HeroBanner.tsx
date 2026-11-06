'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Artwork, artworkImageStyle } from './ArtworkCard';

const SLIDES = [
  {
    bg: 'bg-gradient-to-r from-[#F83758] via-[#FA7189] to-[#FF8C94]',
    tag: '50-40% OFF',
    title: 'Now in (art) products',
    sub: 'All colours & styles available • 100% Certified Originals direct from artist studios',
    cta: 'Shop Now',
    href: '/browse',
    imgBadge: 'Summer Festive Sale',
  },
  {
    bg: 'bg-gradient-to-r from-[#4392F9] via-[#63A4FF] to-[#80B5FF]',
    tag: 'NEW ARRIVALS',
    title: 'Modern Canvas Masterpieces',
    sub: 'Original Oil & Acrylic works curated by master gallery collectors across India',
    cta: 'Explore Collection',
    href: '/browse?category=paintings',
    imgBadge: 'Limited Edition Drop',
  },
  {
    bg: 'bg-gradient-to-r from-[#17223B] via-[#263859] to-[#4392F9]',
    tag: '3D VIRTUAL TRY-ON',
    title: 'Visualize Art On Your Walls',
    sub: 'Upload your living room in 4K to see exact wall scale and lighting before buying',
    cta: 'Launch 3D Studio',
    href: '/spaces',
    imgBadge: 'AI Spatial Visualizer',
  },
];

export default function HeroBanner({ pieces }: { pieces: Artwork[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-stylish-sm my-3">
      <div className={`relative min-h-[300px] sm:min-h-[340px] flex items-center justify-between p-6 sm:p-10 text-white transition-all duration-700 ${slide.bg}`}>
        
        {/* Left Content (Matching Figma Screen 9 Banner) */}
        <div className="max-w-md z-10">
          <span className="inline-block bg-white text-[#F83758] font-black text-xs sm:text-sm px-3 py-1 rounded-full uppercase tracking-wider shadow-xs mb-3">
            {slide.tag}
          </span>

          <h1 className="font-sans text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-xs">
            {slide.title}
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed font-normal">
            {slide.sub}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              href={slide.href}
              className="rounded-lg bg-white text-[#F83758] hover:bg-[#FDF0F3] px-6 py-2.5 text-xs font-extrabold shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <span>{slide.cta}</span>
              <span>→</span>
            </Link>

            <Link
              href="/spaces"
              className="rounded-lg border border-white/40 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-xs"
            >
              3D Room Try-On
            </Link>
          </div>
        </div>

        {/* Right Artwork Showcase Thumbnail (Figma Card Style) */}
        <div className="hidden md:flex items-center gap-3 z-10 shrink-0">
          {pieces.slice(0, 2).map((piece, i) => (
            <Link
              key={piece.id || i}
              href={`/artwork/${piece.id}`}
              className="w-40 rounded-xl bg-white p-2.5 shadow-xl transition hover:-translate-y-1 duration-200 block text-[#17223B]"
            >
              <div
                className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative"
                style={artworkImageStyle(piece) ?? undefined}
              >
                {!piece.imageUrl && (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                )}
                <span className="absolute top-2 left-2 bg-[#F83758] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                  40% OFF
                </span>
              </div>
              <h3 className="font-bold text-xs truncate mt-2 text-[#17223B]">{piece.title}</h3>
              <p className="text-[10px] text-[#626262] truncate">{piece.artist}</p>
              <p className="text-xs font-extrabold text-[#F83758] mt-1">₹{piece.price?.toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
