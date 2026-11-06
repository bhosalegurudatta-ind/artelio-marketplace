'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function FavoriteButton({
  artworkId,
  variant = 'icon',
  initialFavorited = false,
  onToggle,
  className = '',
}: {
  artworkId: string;
  variant?: 'icon' | 'button';
  initialFavorited?: boolean;
  onToggle?: (isFavorited: boolean) => void;
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkRemote() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;

        // Read favourites table through Supabase with Row Level Security
        let { data: fav, error: favErr } = await supabase
          .from('favourites')
          .select('artwork_id')
          .eq('user_id', user.id)
          .eq('artwork_id', artworkId)
          .maybeSingle();

        if (favErr && favErr.message?.includes('favourites')) {
          const fallback = await supabase
            .from('favorites')
            .select('artwork_id')
            .eq('user_id', user.id)
            .eq('artwork_id', artworkId)
            .maybeSingle();
          fav = fallback.data;
        }

        if (active && fav) {
          setFavorited(true);
        }
      } catch (err) {
        console.error('Error checking favourite status:', err);
      }
    }

    checkRemote();

    return () => {
      active = false;
    };
  }, [artworkId]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    // Check if user is logged in; if logged-out visitor clicks heart, send them to /login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const nextState = !favorited;
    setFavorited(nextState);
    setLoading(true);

    try {
      if (nextState) {
        // Save to favourites table through Supabase using row security
        let { error: insErr } = await supabase
          .from('favourites')
          .insert({ user_id: user.id, artwork_id: artworkId });

        if (insErr && insErr.message?.includes('favourites')) {
          await supabase
            .from('favorites')
            .insert({ user_id: user.id, artwork_id: artworkId });
        }
      } else {
        // Unsave from favourites table through Supabase using row security
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
      }

      onToggle?.(nextState);
    } catch (err) {
      console.error('Error toggling favourite:', err);
      setFavorited(!nextState);
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition shadow-xs ${
          favorited
            ? 'border-[#F83758] bg-[#FDF0F3] text-[#F83758]'
            : 'border-[#DEDBDB] bg-white text-[#17223B] hover:border-[#F83758] hover:text-[#F83758]'
        } ${className}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={favorited ? '#F83758' : 'none'}
          stroke={favorited ? '#F83758' : 'currentColor'}
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{favorited ? 'Saved in Favourites' : 'Add to Favourites'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={favorited ? 'Unsave from favourites' : 'Save to favourites'}
      aria-label={favorited ? 'Unsave from favourites' : 'Save to favourites'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#17223B] shadow-sm transition hover:scale-110 active:scale-90 border border-black/5 hover:border-[#F83758]/30 ${className}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={favorited ? '#F83758' : 'none'}
        stroke={favorited ? '#F83758' : '#17223B'}
        strokeWidth="2"
        className="transition-colors"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
