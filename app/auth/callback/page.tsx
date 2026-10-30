'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing authentication…');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        // 1. Get the current active session
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr) {
          throw sessionErr;
        }

        let user = sessionData.session?.user;

        // If session is not immediately available, listen for auth change
        if (!user) {
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession?.user && mounted) {
                authListener.subscription.unsubscribe();
                await syncAndRedirect(newSession.access_token);
              }
            }
          );

          // Timeout fallback if session doesn't arrive within 4 seconds
          setTimeout(async () => {
            if (mounted && !user) {
              const { data: retryData } = await supabase.auth.getUser();
              if (retryData?.user) {
                const { data: retrySession } = await supabase.auth.getSession();
                if (retrySession.session) {
                  await syncAndRedirect(retrySession.session.access_token);
                } else {
                  router.push('/');
                }
              } else {
                setErrorMsg('Could not establish authentication session. Please try logging in again.');
              }
            }
          }, 4000);
          return;
        }

        if (sessionData.session) {
          await syncAndRedirect(sessionData.session.access_token);
        }
      } catch (err: any) {
        console.error('[Auth Callback] Error:', err);
        if (mounted) {
          setErrorMsg(err.message || 'Authentication failed. Please try logging in again.');
        }
      }
    }

    async function syncAndRedirect(token: string) {
      if (!mounted) return;
      setStatus('Finalizing your studio profile…');

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryRole = urlParams.get('role');

        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: queryRole }),
        });

        const data = await res.json().catch(() => ({}));
        const userRole = data?.profile?.role || queryRole;

        if (userRole === 'artist') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } catch (e) {
        // Even if sync has a network glitch, push to home
        router.push('/');
      }
    }

    handleAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-24 text-center">
      <div className="w-full rounded-2xl border border-white/10 bg-[#121826] p-8 shadow-2xl backdrop-blur-md">
        {errorMsg ? (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Sign In Notice</h1>
            <p className="mt-2 text-sm text-slate-300">{errorMsg}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 w-full rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
            <h1 className="font-serif text-2xl font-bold text-white">Connecting to Artelio</h1>
            <p className="mt-2 text-sm text-slate-400">{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}
