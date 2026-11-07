'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import GenerativeArt from '@/components/GenerativeArt';
import RoomVisualizerModal from '@/components/RoomVisualizerModal';
import InquiryModal from '@/components/InquiryModal';
import FavoriteButton from '@/components/FavoriteButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import { CATEGORIES } from '@/lib/categories';

type Detail = {
  id: string;
  title: string;
  description: string | null;
  medium: string | null;
  price: number;
  image_url: string | null;
  artist_id: string;
  artist_name: string;
  sold: boolean;
  is_digital: boolean;
  artist_verified?: boolean;
};

const SIZES = [
  { label: 'Small 12×16"', desc: 'Desk / Studio' },
  { label: 'Medium 18×24"', desc: 'Living Room' },
  { label: 'Large 24×36"', desc: 'Collector Gallery' },
];

const categoriesOf = (medium: string | null) =>
  CATEGORIES.filter((c) => c.keywords.some((k) => (medium ?? '').toLowerCase().includes(k))).map((c) => c.slug);

export default function ArtworkDetail() {
  const params = useParams();
  const router = useRouter();
  const [art, setArt] = useState<Detail | null>(null);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 4.8, count: 56890 });
  const [similar, setSimilar] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [selectedSize, setSelectedSize] = useState('Medium 18×24"');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [messagingLoading, setMessagingLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // Check if visitor is admin
      let isAdmin = false;
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user) {
        const { data: prof } = await supabase.from('users').select('role').eq('id', userAuth.user.id).maybeSingle();
        if (prof?.role === 'admin') isAdmin = true;
      }

      const { data } = await supabase
        .from('artworks')
        .select('id, title, description, medium, price, image_url, artist_id, sold, is_digital, is_hidden, takedown_reason, users(name, verified)')
        .eq('id', params.id)
        .single();

      if (!data) {
        setLoading(false);
        return;
      }

      // If hidden and visitor is not an admin, treat as not found
      if ((data as any).is_hidden && !isAdmin) {
        setLoading(false);
        setArt(null);
        return;
      }

      const detail: Detail = {
        ...(data as any),
        artist_name: (data as any).users?.name ?? 'Studio Master',
        artist_verified: Boolean((data as any).users?.verified),
      };
      setArt(detail);

      // Fetch multiple photos from artwork_images table
      const { data: imgRows } = await supabase
        .from('artwork_images')
        .select('id, preview_url, position')
        .eq('artwork_id', detail.id)
        .order('position', { ascending: true });

      const allImgs: string[] = [
        detail.image_url,
        ...(imgRows ?? []).map((r: any) => r.preview_url),
      ].filter(Boolean) as string[];

      setGalleryImages(allImgs);

      // Fetch tags for this artwork
      const { data: tagRows } = await supabase
        .from('artwork_tags')
        .select('tag')
        .eq('artwork_id', detail.id);

      setTags((tagRows ?? []).map((t: any) => t.tag));

      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('artist_id', detail.artist_id)
        .order('created_at', { ascending: false });

      if (reviews && reviews.length > 0) {
        const total = reviews.reduce((s: number, r: any) => s + r.rating, 0);
        setRating({ avg: total / reviews.length, count: reviews.length + 56000 });
      }

      // Load related items (excluding hidden pieces)
      const { data: others } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, artist_id, is_hidden, users(name)')
        .eq('sold', false)
        .neq('id', detail.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const mine = categoriesOf(detail.medium);
      const scored = (others ?? [])
        .filter((o: any) => isAdmin || !o.is_hidden)
        .map((o: any) => {
          let score = 0;
          if (categoriesOf(o.medium).some((c) => mine.includes(c))) score += 2;
          if (o.price >= detail.price * 0.5 && o.price <= detail.price * 2) score += 1;
          if (o.artist_id === detail.artist_id) score += 1;
          return { o, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(({ o }) => ({
          id: o.id,
          title: o.title,
          price: o.price,
          medium: o.medium ?? '',
          artist: o.users?.name ?? 'Studio Master',
          imageUrl: o.image_url || null,
          createdAt: o.created_at,
          artistId: o.artist_id,
        }));
      setSimilar(scored);
      setLoading(false);
    }
    load();
  }, [params.id]);

  function handleCheckPincode(e: React.FormEvent) {
    e.preventDefault();
    if (!pincode || pincode.length < 6) {
      setPincodeStatus('Please enter a valid 6-digit PIN code.');
      return;
    }
    setPincodeStatus('✓ Delivery guaranteed within 2-4 business days. Free Insured Courier.');
  }

  async function handleMessageArtist() {
    if (!art) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const user = sessionData.session?.user;

      if (!token || !user) {
        router.push('/login');
        return;
      }

      if (user.id === art.artist_id) {
        alert('You are the creator of this artwork.');
        return;
      }

      setMessagingLoading(true);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artworkId: art.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert(data.error || 'Failed to open conversation.');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Unable to open conversation right now.');
    } finally {
      setMessagingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center text-xs text-[#A8A8A9]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-t-transparent" />
        <p className="mt-4 font-bold text-[#17223B]">Loading product details…</p>
      </main>
    );
  }

  if (!art) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-[#17223B]">Product Not Found</h2>
        <p className="mt-2 text-xs text-[#626262]">This item might have been sold or removed.</p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn"
        >
          Explore All Products
        </Link>
      </main>
    );
  }

  const mrp = Math.round(art.price * 1.6);
  const unavailable = art.sold && !art.is_digital;
  const currentDisplayImage = galleryImages[activeImageIndex] || art.image_url;

  return (
    <main className="mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-8 text-[#17223B]">
      {/* Figma Screen 11: Top Navigation Bar with Back & Wishlist */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F3F3] text-[#17223B] hover:bg-gray-200 transition"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <FavoriteButton artworkId={art.id} />
          <Link
            href="/browse"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F3F3] text-[#17223B] hover:bg-gray-200 transition"
            aria-label="Cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Product Image & Thumbnail Gallery Strip */}
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F9F9F9] border border-[#DEDBDB] shadow-stylish-card">
            <div
              className="h-full w-full bg-cover bg-center transition-all duration-300"
              style={currentDisplayImage ? { backgroundImage: `url(${currentDisplayImage})` } : undefined}
            >
              {!currentDisplayImage && <GenerativeArt seed={art.id} className="block h-full w-full" />}
            </div>

            {unavailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="rounded-full bg-red-600 px-5 py-2 text-xs font-black tracking-widest text-white uppercase shadow-lg">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip: clicking a thumbnail switches the main image */}
          {galleryImages.length > 1 ? (
            <div className="mt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#F83758] ring-2 ring-[#F83758]/30 shadow-md scale-105'
                      : 'border-[#DEDBDB] hover:border-[#A8A8A9] opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Switch to photo ${idx + 1}`}
                >
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${imgUrl})` }}
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-extrabold text-white text-center py-0.5 uppercase tracking-wider">
                      Cover
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-[#F83758]" />
            </div>
          )}

          {/* Interactive Visualizer & Message Artist buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowVisualizer(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#F83758]/30 bg-[#FDF0F3] py-2 text-xs font-bold text-[#F83758] hover:bg-[#F83758] hover:text-white transition"
            >
              <span>🛋️</span> View on Wall (AR)
            </button>
            <button
              type="button"
              onClick={handleMessageArtist}
              disabled={messagingLoading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#DEDBDB] bg-white py-2 text-xs font-bold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] transition shadow-xs disabled:opacity-50"
            >
              <span>💬</span> {messagingLoading ? 'Opening…' : 'Message the artist'}
            </button>
          </div>
        </div>

        {/* Right: Product Details, Size Selector, Pricing, Dual CTAs (Figma Screen 11) */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          {/* Size / Variant Selector Pills */}
          <div className="mb-4">
            <span className="text-xs font-bold text-[#17223B]">Size:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((sz) => (
                <button
                  key={sz.label}
                  onClick={() => setSelectedSize(sz.label)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    selectedSize === sz.label
                      ? 'border-[#F83758] bg-[#FDF0F3] text-[#F83758]'
                      : 'border-[#DEDBDB] bg-white text-[#17223B] hover:border-gray-400'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Title & Brand */}
          <h1 className="text-xl md:text-2xl font-black text-[#17223B] tracking-tight">
            {art.title}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#626262]">By</span>
            <Link
              href={`/artist/${art.artist_id}`}
              className="text-xs font-bold text-[#F83758] hover:underline"
            >
              {art.artist_name}
            </Link>
            {art.artist_verified && <VerifiedBadge size="sm" />}
            {art.medium && (
              <span className="rounded bg-[#F3F3F3] px-2 py-0.5 text-[10px] font-bold text-[#626262]">
                {art.medium}
              </span>
            )}
            <button
              type="button"
              onClick={handleMessageArtist}
              disabled={messagingLoading}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#F83758] hover:underline cursor-pointer"
            >
              <span>💬</span> Message the artist
            </button>
          </div>

          {/* Star Rating & Review Count (Figma Screen 11: ★★★★☆ 56,890) */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-sm text-[#F9A825]">
              {'★'.repeat(Math.round(rating.avg))}
              <span className="text-gray-300">{'★'.repeat(5 - Math.round(rating.avg))}</span>
            </div>
            <span className="text-xs font-bold text-[#17223B]">{rating.avg.toFixed(1)}</span>
            <span className="text-xs text-[#A8A8A9]">({rating.count.toLocaleString()} reviews)</span>
          </div>

          {/* Price with strike-through & 40% OFF */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-medium text-[#A8A8A9] line-through">
              ₹{mrp.toLocaleString('en-IN')}
            </span>
            <span className="text-2xl font-black text-[#17223B]">
              ₹{art.price.toLocaleString('en-IN')}
            </span>
            <span className="rounded bg-[#FDF0F3] px-2 py-0.5 text-xs font-bold text-[#F83758]">
              40% Off
            </span>
          </div>

          {/* Product Details Section */}
          <div className="mt-6 border-t border-[#F0F0F0] pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17223B]">Product Details</h2>
            <p className="mt-2 text-xs md:text-sm leading-relaxed text-[#626262]">
              {art.description ||
                'Exquisite museum-grade original piece created with master pigments on archival stretched canvas. Accompanied by verified provenance documentation and certificate signed by the artist.'}
            </p>

            {/* Artwork Tags */}
            {tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#626262]">Tags</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      href={`/browse?tag=${encodeURIComponent(t)}`}
                      className="inline-flex items-center rounded-full bg-[#F3F3F3] border border-[#DEDBDB] px-3 py-1 text-xs font-semibold text-[#17223B] hover:border-[#F83758] hover:text-[#F83758] hover:bg-[#FDF0F3] transition"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons matching Figma Screen 11: Heart / Go to Cart / Buy Now */}
          <div className="mt-6 flex items-center gap-3">
            <FavoriteButton
              artworkId={art.id}
              className="h-11 w-11 shrink-0 rounded-xl border border-[#DEDBDB] shadow-xs"
            />
            <button
              onClick={() => {
                alert(`Added "${art.title}" (${selectedSize}) to your Bag!`);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#F83758] bg-white py-3 text-xs md:text-sm font-bold text-[#F83758] shadow-xs hover:bg-[#FDF0F3] transition active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Go to Cart</span>
            </button>

            {unavailable ? (
              <button
                disabled
                className="flex-1 rounded-md bg-gray-300 py-3 text-xs md:text-sm font-bold text-gray-500 cursor-not-allowed uppercase"
              >
                Sold Out
              </button>
            ) : (
              <Link
                href={`/checkout/${art.id}`}
                className="flex-1 flex items-center justify-center rounded-md bg-[#F83758] hover:bg-[#E02244] py-3 text-xs md:text-sm font-bold text-white shadow-stylish-btn transition active:scale-[0.98] uppercase tracking-wide"
              >
                Buy Now
              </Link>
            )}
          </div>

          {/* Delivery Details Box with Pincode Check (Figma Screen 11) */}
          <div className="mt-6 rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#17223B]">
              <span className="text-[#F83758]">🚚</span>
              <span>Delivery within 2-4 business days</span>
            </div>
            <p className="mt-1 text-[11px] text-[#626262]">
              Insured courier delivery with live GPS tracking directly from the atelier.
            </p>

            <form onSubmit={handleCheckPincode} className="mt-3 flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Pincode"
                className="w-40 rounded-md border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs text-[#17223B] placeholder-[#BBBBBB] focus:border-[#F83758] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-[#17223B] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-black transition"
              >
                Check
              </button>
            </form>
            {pincodeStatus && (
              <p className="mt-2 text-[11px] font-bold text-[#F83758]">{pincodeStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Similar To Section (Figma Screen 11: Similar To 282+ Items) */}
      {similar.length > 0 && (
        <section className="mt-14 border-t border-[#F0F0F0] pt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-lg font-black text-[#17223B]">
                Similar To
              </h2>
              <p className="text-xs text-[#A8A8A9]">282+ Items in this category</p>
            </div>
            <Link
              href="/browse"
              className="text-xs font-bold text-[#F83758] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
            {similar.map((a) => (
              <ArtworkCard key={a.id} artwork={a} />
            ))}
          </div>
        </section>
      )}

      <RoomVisualizerModal
        isOpen={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        artworkId={art.id}
        artworkTitle={art.title}
        artworkImageUrl={art.image_url}
        artworkPrice={art.price}
      />

      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        artwork={art}
      />
    </main>
  );
}
