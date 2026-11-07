'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import InquiryModal from '@/components/InquiryModal';
import VerifiedBadge from '@/components/VerifiedBadge';

type ArtistProfile = {
  id: string;
  name: string;
  bio: string | null;
  shop_name?: string | null;
  banner_url?: string | null;
  about?: string | null;
  shipping_policy?: string | null;
  return_policy?: string | null;
  verified?: boolean;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: string;
};

export default function ArtistShopPage() {
  const params = useParams();
  const artistId = String(params.id);

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function load() {
      // Check if current visitor is admin
      let isAdmin = false;
      const { data: userAuth } = await supabase.auth.getUser();
      if (userAuth?.user) {
        const { data: prof } = await supabase.from('users').select('role').eq('id', userAuth.user.id).maybeSingle();
        if (prof?.role === 'admin') isAdmin = true;
      }

      // 1. Fetch artist shop profile
      const { data: artistData } = await supabase
        .from('users')
        .select('id, name, bio, shop_name, banner_url, about, shipping_policy, return_policy, verified')
        .eq('id', artistId)
        .single();

      setArtist(artistData);

      // 2. Fetch artist artworks
      const { data: rows } = await supabase
        .from('artworks')
        .select('id, title, price, medium, image_url, created_at, sold, is_digital, is_hidden')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      setArtworks(
        (rows ?? [])
          .filter((a: any) => (isAdmin || !a.is_hidden) && !(a.sold && !a.is_digital))
          .map((a: any) => ({
            id: a.id,
            title: a.title,
            price: a.price,
            medium: a.medium ?? '',
            artist: (artistData?.shop_name || artistData?.name) ?? '',
            imageUrl: a.image_url || null,
            createdAt: a.created_at,
            artistId,
            artistVerified: Boolean(artistData?.verified),
          }))
      );

      // 3. Fetch reviews
      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false })
        .limit(20);

      const ids = Array.from(new Set((reviewRows ?? []).map((r: any) => r.reviewer_id)));
      const names: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: people } = await supabase.from('users').select('id, name').in('id', ids);
        (people ?? []).forEach((p: any) => (names[p.id] = p.name));
      }
      setReviews(
        (reviewRows ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer: names[r.reviewer_id] ?? 'Collector',
        }))
      );

      // 4. Check follows count and user's following status
      try {
        const { count } = await supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('artist_id', artistId);
        if (typeof count === 'number') setFollowerCount(count);

        if (userAuth?.user) {
          const { data: followRow } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('follower_id', userAuth.user.id)
            .eq('artist_id', artistId)
            .maybeSingle();
          if (followRow) setIsFollowing(true);
        }
      } catch (fErr) {
        console.warn('Follows table query notice:', fErr);
      }

      setLoading(false);
    }
    load();
  }, [artistId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-24 text-center text-sm text-ink/40">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent mb-4" />
        <p>Opening artist atelier shop…</p>
      </main>
    );
  }

  if (!artist) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink">Shop Not Found</h2>
        <p className="mt-2 text-sm text-ink/60">This artist shop profile could not be found.</p>
        <Link
          href="/browse"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:bg-ink/80 transition-colors"
        >
          Explore Marketplace
        </Link>
      </main>
    );
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const displayName = artist.shop_name?.trim() || artist.name;
  const aboutText = artist.about?.trim() || artist.bio?.trim();

  async function handleToggleFollow() {
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth?.user) {
      alert('Please sign in to follow this artist.');
      return;
    }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: userAuth.user.id, artist_id: artistId });
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from('follows').insert({
          follower_id: userAuth.user.id,
          artist_id: artistId,
        });
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-12">
      {/* 1. Atelier Shop Banner & Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120726] shadow-2xl">
        {/* Banner Image or Gradient Fallback */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          {artist.banner_url ? (
            <Image
              src={artist.banner_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1C0A36] via-[#43105C] to-[#120726]" />
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E17] via-[#0B0E17]/60 to-transparent" />
        </div>

        {/* Hero Details Card Content */}
        <div className="relative -mt-28 sm:-mt-32 px-6 pb-8 sm:px-10 z-10 text-white">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              {artist.verified && (
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 border border-sky-400/40 px-3.5 py-1 text-xs font-bold text-sky-300 backdrop-blur-md mb-3">
                  <span>✦</span> Verified Artelio Resident Artist
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-3xl font-bold md:text-5xl drop-shadow-md text-white">
                  {displayName}
                </h1>
                {artist.verified && <VerifiedBadge size="md" />}
              </div>

              {artist.shop_name && artist.name && artist.shop_name !== artist.name && (
                <p className="mt-1 text-sm font-medium text-white/80">
                  Curated studio by <span className="text-white font-semibold">{artist.name}</span>
                </p>
              )}

              {avg !== null && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-white/90">
                  <span className="text-marigold">★</span>
                  <span className="font-bold">{avg.toFixed(1)}</span>
                  <span className="text-white/60">
                    ({reviews.length} collector {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Follow & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md ${
                  isFollowing
                    ? 'bg-white/20 text-white border border-white/30 hover:bg-white/10'
                    : 'bg-[#F83758] text-white hover:bg-[#E02244]'
                }`}
              >
                <span>{isFollowing ? '✓ Following Shop' : '+ Follow Shop'}</span>
                {followerCount > 0 && <span className="opacity-75">({followerCount})</span>}
              </button>

              <button
                onClick={() => setShowInquiry(true)}
                className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all shadow-sm backdrop-blur-sm"
              >
                <span>💬</span> Inquire about Commission
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. About the Atelier & Policies Section */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About Section */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#121826] p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <span className="text-xl">🎨</span>
            <h2 className="font-serif text-xl font-bold">About the Atelier</h2>
          </div>
          {aboutText ? (
            <div className="text-sm leading-relaxed text-white/80 whitespace-pre-line space-y-3 font-light">
              {aboutText}
            </div>
          ) : (
            <p className="text-sm italic text-white/50">
              Welcome to {displayName}. Original fine art paintings and collector editions crafted with passion.
            </p>
          )}
        </div>

        {/* Shop Policies Card */}
        <div className="space-y-4">
          {/* Shipping Policy */}
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 text-white space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-base">🚚</span>
              <span>Shipping &amp; Packaging</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              {artist.shipping_policy ||
                'Dispatched within 2–3 business days in museum-grade protective packaging. Insured courier transit across India with live AWB tracking.'}
            </p>
          </div>

          {/* Return & Damage Guarantee */}
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 text-white space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span className="text-base">🛡️</span>
              <span>48-Hour Return &amp; Escrow Guarantee</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              {artist.return_policy ||
                'Covered by Artelio Escrow Protection. Inspect the piece for 48 hours upon delivery. In the rare case of transit damage, receive a full refund.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Works / Portfolio Gallery */}
      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between border-b border-ink/[0.08] pb-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-[#F83758] uppercase">Catalog</p>
            <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl mt-1">Available Artworks</h2>
          </div>
          <span className="text-xs font-semibold text-ink/50 bg-[#F3F3F3] px-3 py-1 rounded-full">
            {artworks.length} {artworks.length === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>

        {artworks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-white">
            <p className="text-base font-semibold">No works currently available in this atelier.</p>
            <p className="mt-1 text-xs text-white/50">Follow this shop to receive notification when new collections are unveiled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artworks.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Reviews & Collector Testimonials */}
      {reviews.length > 0 && (
        <section className="mt-16 border-t border-ink/[0.08] pt-12">
          <div className="mb-8">
            <p className="text-[11px] font-bold tracking-widest text-[#F83758] uppercase">Testimonials</p>
            <h2 className="font-serif text-2xl font-bold text-ink md:text-3xl mt-1">Collector Reviews</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-[#121826] p-6 shadow-xs text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-white">{r.reviewer}</span>
                    <span className="block text-[11px] text-white/40">
                      {new Date(r.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-marigold">{'★'.repeat(r.rating)}</span>
                    <span className="text-white/15">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-xs leading-relaxed text-white/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Direct Artist Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
        artwork={{
          id: 'custom-commission',
          title: `Custom Commission for ${displayName}`,
          artist_id: artist.id,
          artist_name: displayName,
        }}
      />
    </main>
  );
}
