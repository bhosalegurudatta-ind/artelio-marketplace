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
    id: 'e36523eb-c4ce-4d3b-b2e4-2d31d67e0332',
    title: 'Twillumi Handcrafted Velvet Lotus Diya with Pearl Trim',
    price: 499,
    medium: 'Handcrafted Velvet Ribbon Craft, Gilded Brass & Seed Pearls',
    artist: 'Gurudatta Bhosale',
    imageUrl: '/artworks/twillumi-pink-lotus-diya.jpg',
  },
  {
    id: '259c9d6a-f1fe-4d4e-a718-6ecceec97503',
    title: 'Heritage Bidriware Handcrafted Silver Inlay Artifacts Collection',
    price: 3499,
    medium: 'Oxidized Zinc-Copper Alloy & Pure Silver Wire Inlay',
    artist: 'Gurudatta Bhosale',
    imageUrl: '/artworks/heritage-bidriware-silver-inlay.jpg',
  },
  {
    id: 'b16492cb-e046-40f1-b762-4068766a3086',
    title: 'Sacred Dharma Wheel Hand-Carved Teak Wood Relief Sculpture',
    price: 5899,
    medium: 'Hand-Chiseled Solid Indian Teakwood Relief',
    artist: 'Gurudatta Bhosale',
    imageUrl: '/artworks/handcarved-wood-relief-sculpture.jpg',
  },
  {
    id: '9f34db0c-268b-472c-a6aa-4960b4a09c78',
    title: 'Artisan Velvet Floral & Bow Embellished Charms Gift Set',
    price: 799,
    medium: 'Plush Velvet Fiber Craft & Fine Pearl Accents',
    artist: 'Gurudatta Bhosale',
    imageUrl: '/artworks/handcrafted-velvet-charms-set.jpg',
  },
];

const CURATED_COLLECTIONS = [
  {
    title: 'Festive Velvet Lotus Diyas',
    tag: 'Sacred Lighting',
    desc: 'Signature Twillumi velvet lotus tea-light holders with delicate pearl rims and gold filigree candle cups.',
    image: '/artworks/twillumi-pink-lotus-diya.jpg',
    link: '/browse?category=crafts',
  },
  {
    title: 'Heritage Bidriware Metalcraft',
    tag: 'Royal Metal Inlay',
    desc: 'Centuries-old black metal vases, decorative plates, and figurines hand-inlaid with pure silver wire.',
    image: '/artworks/heritage-bidriware-silver-inlay.jpg',
    link: '/browse?category=sculpture',
  },
  {
    title: 'Traditional Wood Carving & Relief',
    tag: 'Chiseled Teakwood',
    desc: 'One-of-a-kind sacred relief sculptures chiseled by hand from solid aged teakwood.',
    image: '/artworks/handcarved-wood-relief-sculpture.jpg',
    link: '/browse?category=sculpture',
  },
  {
    title: 'Handmade Velvet Charms & Gifts',
    tag: 'Plush Heritage',
    desc: 'Individually boxed plush velvet floral ornaments, sculpted bow charms, and pearl keychains.',
    image: '/artworks/handcrafted-velvet-charms-set.jpg',
    link: '/browse?category=crafts',
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
          <span>🛡️ 64-bit dHash Provenance Registry</span>
          <span className="hidden md:inline opacity-30">•</span>
          <span>⚡ 90% Directly to Artists</span>
          <span className="hidden lg:inline opacity-30">•</span>
          <span>📦 Direct Atelier Dispatch</span>
        </div>
      </div>

      {/* 2. EVERLANE-STYLE EDITORIAL HERO */}
      <section className="relative border-b border-[#EAE6DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FDF0F3] border border-[#F83758]/20 px-3.5 py-1 text-xs font-bold text-[#F83758]">
                <span>✦ AI Listing Assistant</span>
                <span className="text-[10px] bg-[#F83758] text-white px-2 py-0.5 rounded-full">One Click</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-[#17223B] leading-[1.08]">
                From photo to listing in one click.
              </h1>

              <p className="text-sm sm:text-base text-[#6E6B67] leading-relaxed max-w-xl font-normal">
                Upload an image and get an AI-suggested title, curatorial description, and data-backed price range. Edit anything before you publish. Connect directly with art collectors across India with zero middlemen.
              </p>

              {/* Action Buttons matching Slide 14 & 21 */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/login?role=artist"
                  className="rounded-full bg-[#F83758] hover:bg-[#E02244] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Start as Artist</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/spaces"
                  className="rounded-full border-2 border-[#17223B] bg-[#17223B] hover:bg-black px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition shadow-sm"
                >
                  + Collector Spaces
                </Link>

                <button
                  type="button"
                  onClick={onExplore}
                  className="rounded-full border border-[#DEDBDB] bg-white hover:bg-[#FAF9F6] hover:border-[#17223B] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#17223B] transition"
                >
                  Explore Catalog
                </button>
              </div>

              {/* Trust Metric Badges (Slide 14 & 21 Ribbon) */}
              <div className="pt-6 border-t border-[#F0ECE6] grid grid-cols-3 gap-3 text-left">
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">2,000+</span>
                  <span className="text-[10.5px] text-[#8C8882] uppercase tracking-wider font-semibold">Original Artworks</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">90%</span>
                  <span className="text-[10.5px] text-[#8C8882] uppercase tracking-wider font-semibold">Direct Artist Payout</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black font-serif text-[#17223B]">Razorpay</span>
                  <span className="text-[10.5px] text-[#8C8882] uppercase tracking-wider font-semibold">Escrow Protection</span>
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
                Every acquisition triggers an immediate, verifiable split: 90% goes straight to the creator&apos;s UPI ID or bank account via Razorpay, while original physical works are packaged and shipped directly from the creator&apos;s studio.
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
                Every original artwork is fingerprinted with a 64-bit perceptual difference hash (dHash) in the public registry confirming creator atelier identity, medium, and timestamp.
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
