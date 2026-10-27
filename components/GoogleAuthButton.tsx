'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleAuthButton({
  role = 'customer',
  label = 'Continue with Google',
}: {
  role?: 'customer' | 'artist';
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMsg('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        // If Google provider is not yet enabled in Supabase project dashboard
        if (error.message.includes('not enabled') || error.message.includes('provider')) {
          setErrorMsg('Google Sign-In is being activated on Supabase. You can sign in using email & password below.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize Google login');
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-white/10 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24 0-.75.13-1.52.38-2.24V6.61H1.25C.45 8.24 0 10.06 0 12c0 1.94.45 3.76 1.25 5.39l4.02-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
          />
        </svg>
        <span>{loading ? 'Connecting to Google…' : label}</span>
      </button>

      {errorMsg && (
        <p className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
