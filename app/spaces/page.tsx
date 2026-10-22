'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import InteriorStylistModal from '@/components/InteriorStylistModal';
import AIArtStudioModal from '@/components/AIArtStudioModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mockup {
  id: string;
  image_url: string;
  title: string | null;
  room_style: string | null;
  harmony_score: number | null;
  is_public: boolean;
  created_at: string;
  artworks?: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    medium: string | null;
  } | null;
}

interface FavoriteArtwork {
  id: string;
  createdAt: string;
  artwork: {
    id: string;
    title: string;
    price: number;
    medium: string | null;
    imageUrl: string;
    sold: boolean;
    artist: string;
  };
}

type Tab = 'mockups' | 'favorites' | 'community';

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12v9h5M16 21v-9h5V21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2 3-3 5.5-3 9s1 6 3 9" strokeLinecap="round" />
      <path d="M12 3c2 3 3 5.5 3 9s-1 6-3 9" strokeLinecap="round" />
      <path d="M3 12h18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ open = true }: { open?: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" />
      <path d="M1 1l22 22" strokeLinecap="round" />
    </svg>
  );
}

// ─── Full-screen lightbox ─────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-5 right-5 text-white/80 hover:text-white text-3xl leading-none"
      >
        ✕
      </button>
      <img
        src={src}
        alt="Room mockup preview"
        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Mockup Card ──────────────────────────────────────────────────────────────

function MockupCard({
  mockup,
  onDelete,
  onTogglePublic,
  onPreview,
}: {
  mockup: Mockup;
  onDelete?: (id: string) => void;
  onTogglePublic?: (id: string, current: boolean) => void;
  onPreview: (url: string) => void;
}) {
  const score = mockup.harmony_score;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <button
        onClick={() => onPreview(mockup.image_url)}
        className="block w-full cursor-zoom-in overflow-hidden"
        aria-label="Preview mockup"
      >
        <img
          src={mockup.image_url}
          alt={mockup.title || 'Room mockup'}
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {/* Score badge */}
      {score != null && (
        <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          ✦ {score}/100 harmony
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <p className="truncate font-semibold text-ink">
          {mockup.artworks?.title || mockup.title || 'Room Mockup'}
        </p>
        {mockup.room_style && (
          <p className="mt-0.5 text-xs text-ink/60 capitalize">{mockup.room_style} style</p>
        )}
        {mockup.artworks && (
          <Link
            href={`/artwork/${mockup.artworks.id}`}
            className="mt-1 block truncate text-xs text-brand hover:underline"
          >
            View artwork →
          </Link>
        )}

        {/* Controls (only for owner) */}
        {(onDelete || onTogglePublic) && (
          <div className="mt-3 flex items-center gap-2">
            {onTogglePublic && (
              <button
                onClick={() => onTogglePublic(mockup.id, mockup.is_public)}
                title={mockup.is_public ? 'Make private' : 'Make public'}
                className="flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-xs text-ink/70 hover:border-brand hover:text-brand"
              >
                <EyeIcon open={mockup.is_public} />
                {mockup.is_public ? 'Public' : 'Private'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(mockup.id)}
                title="Delete mockup"
                className="ml-auto flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-xs text-red-500 hover:border-red-400 hover:bg-red-50"
              >
                <TrashIcon /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Favorite Artwork Card ────────────────────────────────────────────────────

function FavCard({
  fav,
  onRemove,
}: {
  fav: FavoriteArtwork;
  onRemove: (id: string) => void;
}) {
  const { artwork } = fav;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/artwork/${artwork.id}`} className="block overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      {artwork.sold && (
        <div className="absolute top-3 left-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
          Sold
        </div>
      )}
      <div className="p-4">
        <p className="truncate font-semibold text-ink">{artwork.title}</p>
        <p className="mt-0.5 text-xs text-ink/60">{artwork.artist}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-brand">${artwork.price.toLocaleString()}</span>
          <div className="flex gap-2">
            {!artwork.sold && (
              <Link
                href={`/artwork/${artwork.id}`}
                className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                Buy now
              </Link>
            )}
            <button
              onClick={() => onRemove(fav.id)}
              title="Remove from favorites"
              className="flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-xs text-red-500 hover:border-red-400 hover:bg-red-50"
            >
              <TrashIcon /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message, cta }: { icon: string; message: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ink/20 bg-paper/50 py-20 text-center">
      <span className="text-5xl">{icon}</span>
      <p className="max-w-xs text-ink/60">{message}</p>
      {cta}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpacesPage() {
  const [tab, setTab] = useState<Tab>('mockups');
  const [myMockups, setMyMockups] = useState<Mockup[]>([]);
  const [myFavorites, setMyFavorites] = useState<FavoriteArtwork[]>([]);
  const [communityMockups, setCommunityMockups] = useState<Mockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stylistModalOpen, setStylistModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      setIsLoggedIn(!!token);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/spaces/gallery', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMyMockups(json.myMockups || []);
      setMyFavorites(json.myFavorites || []);
      setCommunityMockups(json.communityMockups || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load spaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Delete mockup ──────────────────────────────────────────────────────────
  async function handleDeleteMockup(id: string) {
    if (!confirm('Delete this room mockup?')) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    await supabase.from('room_mockups').delete().eq('id', id);
    setMyMockups((prev) => prev.filter((m) => m.id !== id));
    // ignore token in direct Supabase call (RLS handles auth via session)
    void token;
  }

  // ── Toggle public/private ──────────────────────────────────────────────────
  async function handleTogglePublic(id: string, current: boolean) {
    await supabase.from('room_mockups').update({ is_public: !current }).eq('id', id);
    setMyMockups((prev) => prev.map((m) => (m.id === id ? { ...m, is_public: !current } : m)));
  }

  // ── Remove favorite ────────────────────────────────────────────────────────
  async function handleRemoveFavorite(favId: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ artworkId: myFavorites.find((f) => f.id === favId)?.artwork.id }),
    });
    setMyFavorites((prev) => prev.filter((f) => f.id !== favId));
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'mockups', label: 'My Room Mockups', icon: <HomeIcon />, count: myMockups.length },
    { id: 'favorites', label: 'Saved Artworks', icon: <HeartIcon filled />, count: myFavorites.length },
    { id: 'community', label: 'Community Spaces', icon: <GlobeIcon />, count: communityMockups.length },
  ];

  return (
    <main className="min-h-screen bg-paper">
      {/* Hero / header with artistic salon background */}
      <div className="border-b border-black/[0.08] bg-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-5 py-10 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-amethyst bg-purple-50 px-3 py-1 rounded-full border border-purple-200/60">
                ✦ Virtual Gallery
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-black text-ink md:text-4xl">
              Collector’s Private Spaces
            </h1>
            <p className="mt-2 max-w-lg text-xs md:text-sm text-ink/70 leading-relaxed">
              Your curated spatial sanctum — preview how original works harmonize with real architectural interiors, lighting, and finishes in 4K.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setStudioModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2.5 text-xs font-black text-white transition-all hover:scale-105 shadow-md shadow-brand/20"
            >
              <span className="text-base">🎨</span> AI Artwork Studio
            </button>
            <button
              onClick={() => setStylistModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-xs font-bold text-ink transition-all hover:border-brand hover:text-brand shadow-xs"
            >
              <span className="text-base">🛋️</span> AI Room Interior Stylist
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 py-8">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2.5 border-b border-black/[0.06] pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-brand via-purple-600 to-magenta text-white shadow-md'
                  : 'border border-ink/10 bg-white text-ink/70 hover:border-brand/40 hover:text-brand'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    tab === t.id ? 'bg-white/25 text-white' : 'bg-ink/10 text-ink/70'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            <p className="font-semibold">Could not load your spaces</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Not logged in prompt */}
        {!loading && !error && !isLoggedIn && (
          <EmptyState
            icon="🔒"
            message="Sign in to see your saved room mockups and favourite artworks."
            cta={
              <Link
                href="/login"
                className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Log in
              </Link>
            }
          />
        )}

        {/* ── MY ROOM MOCKUPS tab ──────────────────────────────────────────── */}
        {!loading && !error && isLoggedIn && tab === 'mockups' && (
          <>
            {myMockups.length === 0 ? (
              <EmptyState
                icon="🏠"
                message="No room mockups yet. Use 'View in Your Room' on any artwork to see how it looks in your space — then save the result here!"
                cta={
                  <Link
                    href="/browse"
                    className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Browse artworks
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myMockups.map((m) => (
                  <MockupCard
                    key={m.id}
                    mockup={m}
                    onDelete={handleDeleteMockup}
                    onTogglePublic={handleTogglePublic}
                    onPreview={setPreviewUrl}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SAVED ARTWORKS tab ───────────────────────────────────────────── */}
        {!loading && !error && isLoggedIn && tab === 'favorites' && (
          <>
            {myFavorites.length === 0 ? (
              <EmptyState
                icon="♡"
                message="No saved artworks yet. Tap the heart icon on any artwork to save it here."
                cta={
                  <Link
                    href="/browse"
                    className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Discover art
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myFavorites.map((fav) => (
                  <FavCard
                    key={fav.id}
                    fav={fav}
                    onRemove={handleRemoveFavorite}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── COMMUNITY SPACES tab ─────────────────────────────────────────── */}
        {!loading && !error && tab === 'community' && (
          <>
            {communityMockups.length === 0 ? (
              <EmptyState
                icon="🌍"
                message="No community room showcases yet. Be the first to share your room visualization!"
                cta={
                  <Link
                    href="/browse"
                    className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Browse &amp; visualize
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {communityMockups.map((m) => (
                  <MockupCard
                    key={m.id}
                    mockup={m}
                    onPreview={setPreviewUrl}
                    // no delete/toggle for community posts
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {previewUrl && (
        <Lightbox src={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {/* Interior Stylist Modal */}
      <InteriorStylistModal
        isOpen={stylistModalOpen}
        onClose={() => setStylistModalOpen(false)}
      />

      {/* AI Art Studio Modal */}
      <AIArtStudioModal
        isOpen={studioModalOpen}
        onClose={() => setStudioModalOpen(false)}
        userRole="customer"
      />
    </main>
  );
}
