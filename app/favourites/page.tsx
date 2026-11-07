'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import VerifiedBadge from '@/components/VerifiedBadge';

type SavedArtwork = {
  id: string;
  title: string;
  price: number;
  medium: string | null;
  image_url: string | null;
  artist_id: string;
  artist_name: string;
  sold: boolean;
  is_digital: boolean;
  saved_at: string;
  artist_verified?: boolean;
};

export default function FavouritesPage() {
  const router = useRouter();
  const [items, setItems] = useState<SavedArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavourites() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // If not logged in, redirect to login
        if (!user) {
          router.push('/login');
          return;
        }

        // Read favourites table through Supabase using row security
        let favRows: any[] | null = null;
        const { data: rows, error: favErr } = await supabase
          .from('favourites')
          .select('artwork_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (favErr && favErr.message?.includes('favourites')) {
          const fallback = await supabase
            .from('favorites')
            .select('artwork_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          favRows = fallback.data ?? [];
        } else {
          favRows = rows ?? [];
        }

        if (!active) return;

        if (!favRows || favRows.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const artworkIds = favRows.map((f: any) => f.artwork_id);
        const { data: artworks } = await supabase
          .from('artworks')
          .select('id, title, price, medium, image_url, sold, is_digital, artist_id, users(name, verified)')
          .in('id', artworkIds);

        if (!active) return;

        if (artworks) {
          const artMap = new Map(artworks.map((a: any) => [a.id, a]));
          const list: SavedArtwork[] = [];
          for (const f of favRows) {
            const art: any = artMap.get(f.artwork_id);
            if (art) {
              list.push({
                id: art.id,
                title: art.title,
                price: art.price,
                medium: art.medium ?? '',
                image_url: art.image_url ?? null,
                artist_id: art.artist_id,
                artist_name: art.users?.name ?? 'Independent Artist',
                sold: Boolean(art.sold),
                is_digital: Boolean(art.is_digital),
                saved_at: f.created_at,
                artist_verified: Boolean(art.users?.verified),
              });
            }
          }
          setItems(list);
        }
      } catch (err) {
        console.error('Error loading favourites:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFavourites();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleUnsave(artworkId: string, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setUnsavingId(artworkId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Write to favourites table through Supabase using row security
      let { error: delErr } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('artwork_id', artworkId);

      if (delErr && delErr.message?.includes('favourites')) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId);
      }

      // Update state locally
      setItems((prev) => prev.filter((item) => item.id !== artworkId));
    } catch (err) {
      console.error('Failed to unsave artwork:', err);
    } finally {
      setUnsavingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/browse"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#626262] hover:text-[#17223B] transition"
        >
          <span>&larr;</span> Back to Browse
        </Link>
        <span className="text-xs text-[#A8A8A9]">
          {items.length} {items.length === 1 ? 'saved piece' : 'saved pieces'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 border-b border-[#F0F0F0] pb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF0F3] text-lg text-[#F83758]">
            ❤️
          </span>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-black tracking-tight text-[#17223B]">
              My Favourites
            </h1>
            <p className="text-xs text-[#626262]">
              Artworks you have curated and saved to your personal collection.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-t-transparent" />
          <p className="mt-4 text-xs font-bold text-[#626262]">Loading your saved favourites…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[#DEDBDB] bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF0F3] text-3xl">
            🤍
          </div>
          <h2 className="mt-4 font-serif text-lg font-bold text-[#17223B]">No Saved Artworks Yet</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#626262]">
            Click the heart icon on any artwork card or listing to save pieces you love to your favourites.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-xl bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((art) => (
            <div
              key={art.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-xs hover:shadow-stylish-card transition-all duration-200"
            >
              {/* Image Area */}
              <Link href={`/artwork/${art.id}`} className="block relative aspect-square w-full overflow-hidden bg-[#F9F9F9]">
                {art.image_url ? (
                  <Image
                    src={art.image_url}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl bg-[#FDF0F3] text-[#F83758]">
                    🎨
                  </div>
                )}

                {/* Badge for format / status */}
                <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                  {art.sold ? 'Sold' : art.is_digital ? 'Digital Master' : 'Physical Fine Art'}
                </span>
              </Link>

              {/* Details & Actions */}
              <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                <div>
                  <Link href={`/artwork/${art.id}`}>
                    <h3 className="font-serif text-sm font-bold text-[#17223B] line-clamp-1 hover:text-[#F83758] transition">
                      {art.title}
                    </h3>
                  </Link>

                  <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-xs text-[#626262]">
                    <Link href={`/artist/${art.artist_id}`} className="hover:underline">
                      {art.artist_name}
                    </Link>
                    {art.artist_verified && <VerifiedBadge size="xs" />}
                    {art.medium && <span>• {art.medium}</span>}
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-[#17223B]">
                      ₹{art.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#A8A8A9]">Verified Authentic</span>
                  </div>
                </div>

                {/* Buttons Row with prominent Unsave button */}
                <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleUnsave(art.id, e)}
                    disabled={unsavingId === art.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#DEDBDB] bg-white py-2 text-xs font-bold text-[#626262] hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95 disabled:opacity-50"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#F83758"
                      stroke="#F83758"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{unsavingId === art.id ? 'Unsaving…' : 'Unsave'}</span>
                  </button>

                  <Link
                    href={`/artwork/${art.id}`}
                    className="flex-1 flex items-center justify-center rounded-lg bg-[#F83758] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#E02244] transition active:scale-95"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
