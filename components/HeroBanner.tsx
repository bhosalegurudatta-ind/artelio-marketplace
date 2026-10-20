'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GenerativeArt from './GenerativeArt';
import { Artwork, artworkImageStyle } from './ArtworkCard';

const SLIDES = [
  {
    bg: 'bg-[#10233F]',
    kicker: 'Independent artists, one marketplace',
    title: 'Original art, straight from the artist.',
    sub: 'Browse paintings, drawings, prints and digital work, and buy directly from the person who made it.',
    cta: { label: 'Browse artworks', href: '/browse' },
  },
  {
    bg: 'bg-[#0B5C8E]',
    kicker: 'For artists',
    title: 'List your first piece today.',
    sub: 'Free to join. We only take a commission when your work sells.',
    cta: { label: 'Create artist profile', href: '/artist-signup' },
  },
  {
    bg: 'bg-[#0F4C4A]',
    kicker: 'AI listing assistant',
    title: 'From photo to listing in one click.',
    sub: 'Upload an image and get a suggested title, description and price range. Edit anything before you publish.',
    cta: { label: 'Start as an artist', href: '/artist-signup' },
  },
];

// Three tilted frames, filled with real artworks when there are some.
const FRAMES = [
  'left-2 top-12 w-36 -rotate-6 lg:w-40',
  'right-4 top-6 w-40 rotate-6 lg:w-44',
  'left-1/3 bottom-6 w-32 -rotate-2 lg:w-36',
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
          {/* Subtle ambient lighting radial overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/40 pointer-events-none" />

          <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-10 md:px-16">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">
              ✦ {slide.kicker}
            </span>
            <h2 className="mt-4 font-serif text-3xl font-extrabold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl text-white drop-shadow-sm">
              {slide.title}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 md:text-base font-light">
              {slide.sub}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link
                href={slide.cta.href}
                tabIndex={i === index ? 0 : -1}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-bold text-ink shadow-lg transition hover:scale-105 hover:bg-paper"
              >
                {slide.cta.label} →
              </Link>
              <Link
                href="/spaces"
                tabIndex={i === index ? 0 : -1}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 backdrop-blur-md px-6 py-3.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                ✦ Collector Spaces
              </Link>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 hidden w-[45%] md:block" aria-hidden="true">
            {FRAMES.map((pos, n) => {
              const art = pieces[n];
              const style = art ? artworkImageStyle(art) : null;
              return (
                <div key={n} className={`absolute aspect-[4/5] rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:scale-105 ${pos}`}>
                  <div className="h-full w-full overflow-hidden rounded-xl" style={style ?? undefined}>
                    {!style && <GenerativeArt seed={`hero-${i}-${n}`} className="block h-full w-full" />}
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
