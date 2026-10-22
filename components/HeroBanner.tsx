'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GenerativeArt from './GenerativeArt';
import { Artwork, artworkImageStyle } from './ArtworkCard';

const SLIDES = [
  {
    bg: 'bg-gradient-to-br from-[#180A2E] via-[#2F115A] to-[#12072B]',
    glow: 'from-fuchsia-500/25 via-amber-500/20 to-transparent',
    tagBg: 'bg-fuchsia-500/20 border-fuchsia-400/30 text-fuchsia-200',
    kicker: 'Independent Artists • Curated Marketplace',
    title: 'Original art, straight from the creator.',
    sub: 'Discover masterwork oils, vibrant gouache, delicate drawings, and hand-pulled prints directly from the artists who created them.',
    cta: { label: 'Explore the Gallery', href: '/browse' },
    ctaClass: 'bg-gradient-to-r from-amber-400 to-rose-500 text-ink hover:from-amber-300 hover:to-rose-400 shadow-gold-glow',
  },
  {
    bg: 'bg-gradient-to-br from-[#330C1A] via-[#66172D] to-[#1F0710]',
    glow: 'from-rose-500/25 via-amber-500/20 to-transparent',
    tagBg: 'bg-rose-500/20 border-rose-400/30 text-rose-200',
    kicker: 'Artist Atelier & Studio',
    title: 'Turn your canvas into thriving patronage.',
    sub: 'Free to join. Keep 85% of your sale price. AI-powered listing descriptions, certificate generation, and secure Razorpay payouts.',
    cta: { label: 'Launch Your Studio', href: '/artist-signup' },
    ctaClass: 'bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-95 shadow-art-glow',
  },
  {
    bg: 'bg-gradient-to-br from-[#081B38] via-[#0E4166] to-[#052033]',
    glow: 'from-cyan-500/25 via-purple-500/20 to-transparent',
    tagBg: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-200',
    kicker: 'AI Spatial Visualizer & Interior Stylist',
    title: 'Envision masterpieces in your room in 4K.',
    sub: 'Upload your room or browse virtual collectors\' salons to see exact proportions, lighting, and palette harmony before you acquire.',
    cta: { label: 'Experience Spaces', href: '/spaces' },
    ctaClass: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-ink hover:opacity-95 shadow-md',
  },
];

// Three tilted frames with artistic mount styling
const FRAMES = [
  { pos: 'left-2 top-10 w-36 -rotate-6 lg:w-44', badge: '🎨 Curated Piece' },
  { pos: 'right-4 top-4 w-40 rotate-6 lg:w-48', badge: '✨ Fine Art' },
  { pos: 'left-1/3 bottom-4 w-32 -rotate-2 lg:w-40', badge: '🏛️ Gallery Master' },
];

export default function HeroBanner({ pieces }: { pieces: Artwork[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  const go = (step: number) => setIndex((i) => (i + step + SLIDES.length) % SLIDES.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative h-[380px] overflow-hidden rounded-3xl md:h-[440px] shadow-2xl border border-black/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          aria-hidden={i !== index}
          className={`absolute inset-0 ${slide.bg} text-white transition-opacity duration-700 ease-out ${
            i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {/* Luminous colorful ambient glow */}
          <div className={`absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br ${slide.glow} blur-3xl pointer-events-none`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/50 pointer-events-none" />

          <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-10 md:px-16">
            <span className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 art-kicker backdrop-blur-md shadow-sm ${slide.tagBg}`}>
              ✦ {slide.kicker}
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.08] tracking-normal md:text-6xl lg:text-7xl text-white drop-shadow-md">
              {slide.title}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 md:text-base font-light tracking-wide drop-shadow-sm">
              {slide.sub}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={slide.cta.href}
                tabIndex={i === index ? 0 : -1}
                className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 art-tag text-[11px] transition-all duration-200 hover:scale-105 ${slide.ctaClass}`}
              >
                {slide.cta.label} →
              </Link>
              <Link
                href="/spaces"
                tabIndex={i === index ? 0 : -1}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-7 py-3.5 art-tag text-[11px] text-white transition hover:bg-white/20 hover:border-white/50"
              >
                ✦ Collector Spaces
              </Link>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 hidden w-[45%] md:block" aria-hidden="true">
            {FRAMES.map((item, n) => {
              const art = pieces[n];
              const style = art ? artworkImageStyle(art) : null;
              return (
                <div
                  key={n}
                  className={`absolute aspect-[4/5] rounded-2xl bg-white p-2.5 shadow-2xl ring-2 ring-white/30 backdrop-blur-md transition-all duration-500 hover:scale-110 hover:rotate-0 hover:z-30 ${item.pos}`}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl border border-black/5" style={style ?? undefined}>
                    {!style && <GenerativeArt seed={`hero-${i}-${n}`} className="block h-full w-full" />}
                    <div className="absolute bottom-2 left-2 rounded-md bg-ink/75 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white tracking-wider">
                      {item.badge}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="absolute bottom-5 left-14 z-20 flex items-center gap-2 md:left-20">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
}
