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
    try {
      const saved = JSON.parse(localStorage.getItem('artelio_favorites') || '[]');
      if (saved.includes(artworkId)) setFavorited(true);
    } catch {}

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
      alert('Please log in to save artworks to your Wishlist.');
      return;
    }

    const nextState = !favorited;
    setFavorited(nextState);
    setLoading(true);

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
        className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-bold transition shadow-xs ${
          favorited
            ? 'border-[#FC2779] bg-[#FFF0F5] text-[#FC2779]'
            : 'border-[#E0E0E0] bg-white text-[#333333] hover:border-[#FC2779] hover:text-[#FC2779]'
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={favorited ? '#FC2779' : 'none'}
          stroke={favorited ? '#FC2779' : 'currentColor'}
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{favorited ? 'In Wishlist' : 'Add to Wishlist'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-400 shadow-md transition hover:scale-110 active:scale-90 border border-gray-100"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={favorited ? '#FC2779' : 'none'}
        stroke={favorited ? '#FC2779' : '#555555'}
        strokeWidth="2.2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
