'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ArtworkCard, { Artwork } from '@/components/ArtworkCard';
import VerifiedBadge from '@/components/VerifiedBadge';
import ArtistCard, { ArtistCardProps } from '@/components/ArtistCard';

type FollowedArtist = {
  id: string;
  name: string;
  shop_name: string | null;
  banner_url: string | null;
  bio: string | null;
  verified: boolean;
};

export default function FollowingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [formatFilter, setFormatFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [suggestedArtists, setSuggestedArtists] = useState<FollowedArtist[]>([]);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      setLoading(true);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user) {
          if (!active) return;
          setLoggedIn(false);
          setLoading(false);
          return;
        }

        if (!active) return;
        setLoggedIn(true);

        // 1. Fetch artists followed by current user
        let followedIds: string[] = [];
        try {
          const { data: followRows, error: followErr } = await supabase
            .from('follows')
            .select('artist_id, created_at')
            .eq('follower_id', user.id)
            .order('created_at', { ascending: false });

          if (!followErr && followRows) {
            followedIds = followRows.map((f: any) => f.artist_id).filter(Boolean);
          }
        } catch {}

        // Fallback to local follows if follows table is not yet migrated in db
        if (followedIds.length === 0 && typeof window !== 'undefined') {
          try {
            const local = JSON.parse(localStorage.getItem('artelio_follows') || '[]');
            if (Array.isArray(local) && local.length > 0) followedIds = local;
          } catch {}
        }

        if (followedIds.length === 0) {
          // If no follows, fetch verified / popular artists to recommend
          let { data: featured } = await supabase
            .from('users')
            .select('id, name, shop_name, banner_url, bio, verified')
            .eq('role', 'artist')
            .limit(6);

          if (!featured) {
            const fb = await supabase.from('users').select('id, name, bio').eq('role', 'artist').limit(6);
            featured = fb.data as any;
          }

          if (active) {
            setFollowedArtists([]);
            setArtworks([]);
            setSuggestedArtists(
              (featured || []).map((a: any) => ({
                id: a.id,
                name: a.name || 'Resident Artist',
                shop_name: a.shop_name || a.name,
                banner_url: a.banner_url || null,
                bio: a.bio || 'Studio Resident Artist on Artelio',
                verified: true,
              }))
            );
            setLoading(false);
          }
          return;
        }

        // 2. Fetch profiles for followed artists
        let { data: artistProfiles } = await supabase
          .from('users')
          .select('id, name, shop_name, banner_url, bio, verified')
          .in('id', followedIds);

        if (!artistProfiles) {
          const fb = await supabase.from('users').select('id, name, bio').in('id', followedIds);
          artistProfiles = fb.data as any;
        }

        const artistMap = new Map<string, FollowedArtist>();
        (artistProfiles || []).forEach((a: any) => {
          artistMap.set(a.id, {
            id: a.id,
            name: a.name || 'Studio Artist',
            shop_name: a.shop_name || a.name,
            banner_url: a.banner_url || null,
            bio: a.bio || 'Resident Creator',
            verified: true,
          });
        });

        const artistsList = followedIds
          .map((id) => artistMap.get(id))
          .filter((a): a is FollowedArtist => Boolean(a));

        if (!active) return;
        setFollowedArtists(artistsList);

        // 3. Fetch artworks from the followed artists
        let { data: artRows, error: artErr } = await supabase
          .from('artworks')
          .select('id, title, price, medium, image_url, created_at, artist_id, is_digital, is_hidden, sold, users(name, verified)')
          .in('artist_id', followedIds)
          .order('created_at', { ascending: false })
          .limit(60);

        if (artErr || !artRows) {
          const fb = await supabase
            .from('artworks')
            .select('id, title, price, medium, image_url, created_at, artist_id, is_digital, sold, users(name)')
            .in('artist_id', followedIds)
            .order('created_at', { ascending: false })
            .limit(60);
          artRows = fb.data as any;
        }

        if (active) {
          setArtworks(
            (artRows || []).map((a: any) => {
              const artistInfo = artistMap.get(a.artist_id);
              return {
                id: a.id,
                title: a.title,
                price: a.price,
                medium: a.medium || '',
                artist: artistInfo?.shop_name || artistInfo?.name || a.users?.name || 'Studio Artist',
                imageUrl: a.image_url || null,
                createdAt: a.created_at,
                artistId: a.artist_id,
                artistVerified: Boolean(artistInfo?.verified ?? a.users?.verified),
              };
            })
          );
        }
      } catch (err: any) {
        console.error('Error loading following feed:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();

    return () => {
      active = false;
    };
  }, []);

  // Filter & Sort Artworks
  const displayedArtworks = useMemo(() => {
    let list = [...artworks];

    if (selectedArtistId !== 'all') {
      list = list.filter((a) => a.artistId === selectedArtistId);
    }

    if (formatFilter === 'physical') {
      list = list.filter((a) => !a.medium.toLowerCase().includes('digital'));
    } else if (formatFilter === 'digital') {
      list = list.filter((a) => a.medium.toLowerCase().includes('digital'));
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [artworks, selectedArtistId, formatFilter, sortBy]);

  // View: Not signed in
  if (!loading && !loggedIn) {
    return (
      <main className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E8E8E8] bg-white p-8 sm:p-12 text-center shadow-stylish-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF0F3] text-3xl">
            ✨
          </div>
          <h1 className="mt-6 font-serif text-2xl sm:text-3xl font-extrabold text-[#17223B]">
            Your Following Feed
          </h1>
          <p className="mt-3 text-sm text-[#626262] leading-relaxed">
            Follow certified resident artists and independent creators to receive real-time drops and fresh studio releases right here.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?redirect=/following"
              className="w-full sm:w-auto rounded-xl bg-[#F83758] px-8 py-3 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-[#DEDBDB] bg-white px-8 py-3 text-xs font-bold text-[#17223B] hover:border-[#17223B] transition"
            >
              Browse All Artworks
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E8E8E8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FDF0F3] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F83758]">
              Collector Feed
            </span>
            <span className="text-xs font-bold text-[#A8A8A9]">
              • {followedArtists.length} {followedArtists.length === 1 ? 'Artist' : 'Artists'} Followed
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#17223B] tracking-tight">
            New Works from Artists You Follow
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#626262]">
            Latest original releases and gallery additions from your subscribed studios.
          </p>
        </div>

        {/* Filter Controls */}
        {artworks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Format Filter */}
            <div className="flex rounded-lg border border-[#DEDBDB] bg-white p-0.5 shadow-2xs">
              <button
                onClick={() => setFormatFilter('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  formatFilter === 'all'
                    ? 'bg-[#F83758] text-white shadow-xs'
                    : 'text-[#626262] hover:text-[#17223B]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFormatFilter('physical')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  formatFilter === 'physical'
                    ? 'bg-[#F83758] text-white shadow-xs'
                    : 'text-[#626262] hover:text-[#17223B]'
                }`}
              >
                Physical
              </button>
              <button
                onClick={() => setFormatFilter('digital')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  formatFilter === 'digital'
                    ? 'bg-[#F83758] text-white shadow-xs'
                    : 'text-[#626262] hover:text-[#17223B]'
                }`}
              >
                Digital
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] focus:border-[#F83758] focus:outline-none shadow-2xs"
            >
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        )}
      </div>

      {/* Artists Filter Chips Bar */}
      {followedArtists.length > 0 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedArtistId('all')}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              selectedArtistId === 'all'
                ? 'bg-[#17223B] text-white shadow-xs'
                : 'bg-white border border-[#DEDBDB] text-[#626262] hover:border-[#17223B] hover:text-[#17223B]'
            }`}
          >
            All Studios ({artworks.length})
          </button>
          {followedArtists.map((artist) => {
            const count = artworks.filter((a) => a.artistId === artist.id).length;
            const isSelected = selectedArtistId === artist.id;
            return (
              <button
                key={artist.id}
                onClick={() => setSelectedArtistId(artist.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-[#F83758] text-white shadow-xs'
                    : 'bg-white border border-[#DEDBDB] text-[#17223B] hover:border-[#F83758]'
                }`}
              >
                <span>{artist.shop_name || artist.name}</span>
                {artist.verified && <VerifiedBadge size="xs" />}
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#A8A8A9]'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent" />
          <p className="mt-3 text-xs font-bold text-[#626262]">Loading your following feed…</p>
        </div>
      ) : followedArtists.length === 0 ? (
        /* Empty State: User does not follow any artists yet */
        <div className="mt-8 rounded-3xl border border-[#E8E8E8] bg-white p-8 sm:p-12 shadow-stylish-card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF0F3] text-3xl">
            🧑‍🎨
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-[#17223B]">
            You Haven’t Followed Any Artists Yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#626262] leading-relaxed">
            Follow your favorite creators to curate your personal feed of new originals, prints, and studio drops.
          </p>

          {suggestedArtists.length > 0 && (
            <div className="mt-10 text-left">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#17223B] mb-4">
                Recommended Resident Artists
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={{
                      id: artist.id,
                      name: artist.name,
                      shop_name: artist.shop_name,
                      banner_url: artist.banner_url,
                      bio: artist.bio,
                      verified: artist.verified,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#F0F0F0]">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
            >
              <span>Explore Marketplace</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      ) : displayedArtworks.length === 0 ? (
        /* Empty state: Follows artists but no artworks match filter */
        <div className="mt-8 rounded-3xl border border-[#E8E8E8] bg-white p-12 text-center shadow-xs">
          <p className="text-base font-bold text-[#17223B]">No Artworks Found</p>
          <p className="mt-1 text-xs text-[#626262]">
            The artists you follow haven’t posted items matching this filter yet.
          </p>
          <button
            onClick={() => {
              setSelectedArtistId('all');
              setFormatFilter('all');
            }}
            className="mt-4 rounded-xl bg-[#F83758] px-5 py-2 text-xs font-bold text-white shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Grid of Artworks */
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {displayedArtworks.map((art) => (
            <ArtworkCard key={art.id} artwork={art} />
          ))}
        </div>
      )}
    </main>
  );
}
