'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FavoriteButton({
  artworkId,
  variant = 'icon',
}: {
  artworkId: string;
  variant?: 'icon' | 'button';
}) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage cache
    try {
      const saved = JSON.parse(localStorage.getItem('artelio_favorites') || '[]');
      if (saved.includes(artworkId)) setFavorited(true);
    } catch {}

    // Check with Supabase if logged in
    async function checkRemote() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('artwork_id', artworkId)
        .maybeSingle();

      if (fav) {
        setFavorited(true);
        try {
          const saved = JSON.parse(localStorage.getItem('artelio_favorites') || '[]');
          if (!saved.includes(artworkId)) {
            localStorage.setItem('artelio_favorites', JSON.stringify([...saved, artworkId]));
          }
        } catch {}
      }
    }
    checkRemote();
  }, [artworkId]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert('Please log in to save artworks to your Favorites & Spaces.');
      return;
    }

    const nextState = !favorited;
    setFavorited(nextState);
    setLoading(true);

    // Update localStorage cache
    try {
      const saved = JSON.parse(localStorage.getItem('artelio_favorites') || '[]');
      if (nextState) {
        if (!saved.includes(artworkId)) localStorage.setItem('artelio_favorites', JSON.stringify([...saved, artworkId]));
      } else {
        localStorage.setItem('artelio_favorites', JSON.stringify(saved.filter((id: string) => id !== artworkId)));
      }
    } catch {}

    try {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ artworkId }),
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition shadow-sm ${
          favorited
            ? 'border-clay/40 bg-clay/10 text-clay hover:bg-clay/20'
            : 'border-white/15 bg-[#121826] text-white/90 hover:border-clay hover:text-clay'
        }`}
      >
        <span className={favorited ? 'text-clay scale-110' : 'text-white/60'}>
          {favorited ? '♥' : '♡'}
        </span>
        <span>{favorited ? 'Saved in My Spaces' : 'Save to Favorites'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
      className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#121826]/90 border border-white/20 text-sm shadow backdrop-blur transition hover:scale-110 hover:bg-[#161F30]"
    >
      <span className={favorited ? 'text-clay font-bold' : 'text-white/60'}>
        {favorited ? '♥' : '♡'}
      </span>
    </button>
  );
}
