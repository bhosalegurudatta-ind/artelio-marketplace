'use client';

import React from 'react';
import Link from 'next/link';

type LandingArtwork = {
  id: string;
  title: string;
  price: number;
  medium: string;
  artist: string;
  imageUrl: string;
  isDigital?: boolean;
};

const FEATURED_PIECES: LandingArtwork[] = [
  {
    id: 'ceramic-lamp',
    title: 'Botanical Mosaic Ceramic Mushroom Lamp',
    price: 2749,
    medium: 'Ceramic Mosaic & Ambient Brass',
    artist: 'Priya Sundaram',
    imageUrl: '/artworks/ceramic-mosaic-mushroom-lamp.png',
  },
  {
    id: 'driftwood-lamp',
    title: 'Artisan Natural Driftwood Sculptural Edison Lamp',
    price: 4399,
    medium: 'Driftwood & Vintage Filament',
    artist: 'Vikramaditya Rao',
    imageUrl: '/artworks/artisan-driftwood-lamp.jpg',
  },
  {
    id: 'velvet-diyas',
    title: 'Handcrafted Velvet Floral Festive Diyas (Set of 6)',
    price: 879,
    medium: 'Handmade Velvet & Brass Beading',
    artist: 'Elena Rostova',
    imageUrl: '/artworks/handmade-velvet-diyas.jpg',
  },
  {
    id: 'lotus-diyas',
    title: 'Twillumi Artisan Velvet Lotus Diya with Pearl Trim',
    price: 1319,
    medium: 'Festive Velvet & Gilded Pearls',
    artist: 'Elena Rostova',
    imageUrl: '/artworks/twillumi-lotus-diyas.jpg',
  },
];

const CURATED_COLLECTIONS = [
  {
    title: 'Sculptural Lighting & Decor',
    tag: 'Atelier Interior',
    desc: 'Bespoke driftwood, terracotta, and mosaic ambient lighting handcrafted by master artisans.',
    image: '/artworks/ceramic-mosaic-mushroom-lamp.png',
    link: '/browse?category=sculpture',
  },
  {
    title: 'Handmade Velvet Crafts',
    tag: 'Heritage Festive',
    desc: 'Festive diya sets crafted from premium velvet, brass cups, and intricate pearl trims.',
    image: '/artworks/twillumi-lotus-diyas.jpg',
    link: '/browse?category=crafts',
  },
  {
    title: 'Original Canvas Paintings',
    tag: 'Fine Art Originals',
    desc: 'One-of-a-kind oil, acrylic, and mixed media canvases from independent studio painters.',
    image: '/artworks/handmade-velvet-diyas.jpg',
    link: '/browse?category=paintings',
  },
  {
    title: 'Verified Digital Collectibles',
    tag: 'Instant Release',
    desc: 'Lossless master resolution digital editions with immutable cryptographic proof of provenance.',
    image: '/artworks/sacred-lotus-digital-edition.jpg',
    link: '/browse?category=digital',
  },
];

export default function LandingPage({ onExplore }: { onExplore?: () => void }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#17223B] font-sans antialiased selection:bg-[#F83758] selection:text-white">
      {/* 1. TOP EDITORIAL TICKER BAR */}
      <div className="bg-[#17223B] text-white/90 text-[11px] font-medium tracking-wider uppercase py-2 px-4 text-center border-b border-white/10">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <span>✨ Direct from Independent Ateliers</span>
          <span className="hidden sm:inline opacity-30">•</span>
          <span>📜 Verified Certificate of Authenticity</span>
          <span className="hidden md:inline opacity-30">•</span>
          <span>⚡ 90% Directly to Artists</span>
          <span className="hidden lg:inline opacity-30">•</span>
          <span>🚚 Doorstep Inspection &amp; Escrow</span>
        </div>
      </div>

      {/* 2. EVERLANE-STYLE EDITORIAL HERO */}
      <section className="relative border-b border-[#EAE6DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FDF0F3] border border-[#F83758]/20 px-3.5 py-1 text-xs font-bold text-[#F83758]">
                <span>Artelio Studio Marketplace</span>
                <span className="text-[10px] bg-[#F83758] text-white px-1.5 py-0.2 rounded-full">New Edit</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-[#17223B] leading-[1.08]">
                Where Master Artisans &amp; Connoisseurs Meet.
              </h1>

              <p className="text-sm sm:text-base text-[#6E6B67] leading-relaxed max-w-xl font-normal">
                Discover authentic sculptural lighting, handmade festive craft, and original canvas masterpieces direct from independent ateliers. No corporate markups — artists retain 90% of their earnings with transparent escrow protection.
              </p>

              {/* Action Buttons matching Everlane clean aesthetic */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="rounded-full bg-[#F83758] hover:bg-[#E02244] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Sign In / Create Account</span>
                  <span>→</span>
                </Link>

                <button
                  type="button"
                  onClick={onExplore}
                  className="rounded-full border border-[#DEDBDB] bg-white hover:bg-[#FAF9F6] hover:border-[#17223B] px-6 py-3.5 text-xs sm:text-sm font-bold text-[#17223B] transition"
                >
                  Explore Catalog as Guest
                </button>
              </div>

              {/* Trust Metric Badges */}
              <div className="pt-6 border-t border-[#F0ECE6] grid grid-cols-3 gap-4 text-left">
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">90%</span>
                  <span className="text-[11px] text-[#8C8882] uppercase tracking-wider font-semibold">Artist Payout</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">100%</span>
                  <span className="text-[11px] text-[#8C8882] uppercase tracking-wider font-semibold">Verified Proof</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">Razorpay</span>
                  <span className="text-[11px] text-[#8C8882] uppercase tracking-wider font-semibold">Escrow Protection</span>
                </div>
              </div>
            </div>

            {/* Right Featured Editorial Artwork Showcase (Everlane Lookbook style) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-[#E8E4DD] bg-[#FAF8F5] p-4 sm:p-6 shadow-stylish-card">
                <div className="relative aspect-[4/5] sm:aspect-[1/1] overflow-hidden rounded-2xl bg-white border border-[#EAE6DF]">
                  <img
                    src="/artworks/ceramic-mosaic-mushroom-lamp.png"
                    alt="Botanical Mosaic Ceramic Mushroom Lamp"
                    className="h-full w-full object-cover object-center hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#17223B] shadow-xs">
                      Curator’s Choice
                    </span>
                  </div>
                </div>

                {/* Artwork Information Bar */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#F83758]">Sculptural Lighting</span>
                    <h3 className="font-serif font-black text-base sm:text-lg text-[#17223B]">
                      Botanical Mosaic Ceramic Mushroom Lamp
                    </h3>
                    <p className="text-xs text-[#6E6B67]">By Studio Master Priya Sundaram</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-lg font-black text-[#17223B]">₹2,749</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      In Stock
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "THE EDIT" — 4 CURATED CATEGORIES (Everlane Style) */}
      <section className="py-16 md:py-24 border-b border-[#EAE6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">The Seasonal Edit</span>
              <h2 className="mt-1 text-3xl sm:text-4xl font-serif font-black text-[#17223B]">
                Curated by Atelier Specialists
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-[#F83758] hover:text-[#E02244] uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>View All Categories</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CURATED_COLLECTIONS.map((c, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EAE6DF] bg-white p-4 shadow-xs hover:shadow-stylish-card transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#FAF8F5] border border-[#F0ECE6]">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-[#17223B] shadow-xs">
                      {c.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif font-bold text-base text-[#17223B] group-hover:text-[#F83758] transition">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#6E6B67] leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F0ECE6] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#17223B] group-hover:text-[#F83758]">Explore Collection</span>
                  <span className="text-[#F83758] transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SPLIT ATELIER STORY: "EVERY STROKE TELLS A STORY" */}
      <section className="py-16 md:py-24 bg-white border-b border-[#EAE6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Story Image (Everlane Column 4 style) */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-stylish-card border border-[#EAE6DF]">
                <img
                  src="/artworks/artisan-driftwood-lamp.jpg"
                  alt="Artisan at work"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-8">
                  <div className="text-white">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#F83758] bg-white px-2 py-0.5 rounded-full">
                      Studio Spotlight
                    </span>
                    <h4 className="mt-2 text-xl font-serif font-black">Vikramaditya Rao</h4>
                    <p className="text-xs text-white/80">Sculptor &amp; Master Woodturner • Western Ghats Atelier</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Editorial Text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">Radical Transparency</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#17223B] leading-tight">
                No Middlemen. No Gallerist Markups. Just Authentic Art.
              </h2>
              <p className="text-sm text-[#6E6B67] leading-relaxed">
                Traditional galleries take 40% to 50% commission, leaving artists struggling to sustain their studios. At Artelio, we built a fair-trade digital marketplace with a transparent 10% platform fee.
              </p>
              <p className="text-sm text-[#6E6B67] leading-relaxed">
                Every acquisition triggers an immediate, verifiable split: 90% goes straight to the creator&apos;s UPI ID or bank account via Razorpay, while you receive an insured parcel with an immutable Certificate of Authenticity.
              </p>

              {/* Verified Quote Box */}
              <div className="rounded-2xl border-l-4 border-[#F83758] bg-[#FAF8F5] p-5 text-xs text-[#17223B]">
                <p className="italic leading-relaxed">
                  &ldquo;Artelio connects my studio directly to art lovers across India. I set my own prices, see my earnings settled in real-time, and know my collectors receive genuine pieces.&rdquo;
                </p>
                <span className="mt-2 block font-bold text-[#F83758]">— Priya Sundaram, Ceramicist &amp; Studio Lead</span>
              </div>

              <div className="pt-2">
                <Link
                  href="/artist-signup"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#17223B] hover:text-[#F83758] transition uppercase tracking-wider"
                >
                  <span>Apply to Sell as an Independent Artist</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE 3 CORE PILLARS (Everlane "Keep It Clean / Do Right by People" style) */}
      <section className="py-16 md:py-20 bg-[#FAF9F6] border-b border-[#EAE6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">The Artelio Standard</span>
          <h2 className="mt-1 text-3xl sm:text-4xl font-serif font-black text-[#17223B]">
            Designed for Modern Collectors
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#6E6B67] max-w-xl mx-auto">
            We hold ourselves and our atelier partners to rigorous standards of craftsmanship, provenance, and fair trade.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF0F3] text-2xl text-[#F83758] mb-5">
                🛡️
              </div>
              <h3 className="font-serif font-black text-lg text-[#17223B]">Immutable Provenance</h3>
              <p className="mt-2 text-xs text-[#6E6B67] leading-relaxed">
                Every original and limited edition includes a serialized Certificate of Authenticity (CoA) bearing the artist&apos;s studio verification, physical dimensions, and medium.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF0F3] text-2xl text-[#F83758] mb-5">
                🔒
              </div>
              <h3 className="font-serif font-black text-lg text-[#17223B]">Doorstep Escrow Security</h3>
              <p className="mt-2 text-xs text-[#6E6B67] leading-relaxed">
                Funds are held in secure Razorpay escrow. Artists dispatch with insured couriers (BlueDart / Delhivery) and funds are only released after safe doorstep arrival.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF0F3] text-2xl text-[#F83758] mb-5">
                🤖
              </div>
              <h3 className="font-serif font-black text-lg text-[#17223B]">AI Style-Fusion Studio</h3>
              <p className="mt-2 text-xs text-[#6E6B67] leading-relaxed">
                Pioneering the intersection of fine art and technology. Verified creators use Google Gemini AI to fuse classical artistic styles and draft rich, authentic descriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED ARTWORKS PREVIEW STRIP */}
      <section className="py-16 md:py-24 bg-white border-b border-[#EAE6DF]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">Trending in Gallery</span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-black text-[#17223B]">
                New Atelier Additions
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-[#F83758] hover:underline uppercase tracking-wider"
            >
              Sign In to Buy →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {FEATURED_PIECES.map((piece) => (
              <div
                key={piece.id}
                className="group rounded-xl border border-[#EAE6DF] bg-white overflow-hidden shadow-xs hover:shadow-stylish-card transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-[#FAF8F5]">
                    <img
                      src={piece.imageUrl}
                      alt={piece.title}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 rounded bg-[#F83758] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-xs">
                      Original
                    </span>
                  </div>

                  <div className="p-3">
                    <h4 className="font-bold text-xs sm:text-sm text-[#17223B] line-clamp-1 group-hover:text-[#F83758] transition">
                      {piece.title}
                    </h4>
                    <p className="text-[11px] text-[#6E6B67] line-clamp-1 mt-0.5">{piece.artist}</p>
                    <p className="text-sm font-extrabold text-[#17223B] mt-2">
                      ₹{piece.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <Link
                    href="/login"
                    className="block w-full rounded-md bg-[#17223B] hover:bg-[#F83758] text-white text-center py-2 text-xs font-bold transition shadow-xs"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HIGH-CONVERTING BOTTOM INVITATION BANNER (Everlane style) */}
      <section className="bg-[#17223B] text-white py-16 md:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">Join the Movement</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-black text-white">
            Ready to Begin Your Art Collection?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed max-w-xl mx-auto">
            Create your account in seconds with Google or email. Browse thousands of authentic pieces, commission custom art, or open your own atelier studio.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full bg-[#F83758] hover:bg-[#E02244] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95"
            >
              Sign In / Register
            </Link>
            <button
              type="button"
              onClick={onExplore}
              className="w-full sm:w-auto rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition"
            >
              Browse Catalog as Guest →
            </button>
          </div>
        </div>
      </section>

      {/* 8. MINIMALIST FOOTER */}
      <footer className="bg-white border-t border-[#EAE6DF] py-8 text-center text-xs text-[#8C8882]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-sm text-[#17223B]">ARTELIO</span>
            <span>• Independent Fine Art &amp; Sculptural Ateliers</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-[#17223B]">
            <Link href="/browse" className="hover:text-[#F83758]">Marketplace</Link>
            <Link href="/artist-signup" className="hover:text-[#F83758]">Sell Art</Link>
            <Link href="/login" className="hover:text-[#F83758]">Sign In</Link>
          </div>
          <p>© {new Date().getFullYear()} Artelio Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
