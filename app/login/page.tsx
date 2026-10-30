'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function Login() {
  const router = useRouter();
  const [loginRole, setLoginRole] = useState<'customer' | 'artist'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const roleParam = new URLSearchParams(window.location.search).get('role');
      if (roleParam === 'artist') {
        setLoginRole('artist');
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (isForgot) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?role=${loginRole}`,
        });
        if (error) throw error;
        setInfoMsg('Password reset link sent! Please check your email inbox.');
        setIsForgot(false);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message || 'Could not log you in.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setErrorMsg('Your email address has not been confirmed yet.');
      } else {
        setErrorMsg(msg);
      }
      setLoading(false);
      return;
    }

    // Sync profile and redirect
    try {
      const session = data.session;
      if (session) {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ role: loginRole }),
        });
        const syncData = await res.json().catch(() => ({}));
        const userRole = syncData?.profile?.role || loginRole;
        router.push(userRole === 'artist' ? '/dashboard' : '/profile');
        router.refresh();
        return;
      }
    } catch {
      // Fallback redirect based on selected login tab
    }

    router.push(loginRole === 'artist' ? '/dashboard' : '/profile');
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!email) {
      setErrorMsg('Please enter your email address first.');
      return;
    }
    setResending(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?role=${loginRole}`,
        },
      });
      if (error) throw error;
      setInfoMsg('Confirmation email resent! Please check your inbox and spam folder.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend email. Please try again in a few moments.');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border border-white/10 bg-[#121826] p-8 shadow-2xl backdrop-blur-md">
        
        {/* Role Selection Tabs: Artist vs User */}
        {!isForgot && (
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1 text-center">
            <button
              type="button"
              onClick={() => {
                setLoginRole('customer');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                loginRole === 'customer'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖼️</span>
              <span>Collector / User</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginRole('artist');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                loginRole === 'artist'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎨</span>
              <span>Artist / Creator</span>
            </button>
          </div>
        )}

        <h1 className="text-2xl font-serif font-bold text-white">
          {isForgot
            ? 'Reset Password'
            : loginRole === 'artist'
            ? 'Artist Studio Login'
            : 'Collector / User Login'}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {isForgot
            ? 'Enter your account email to receive a password recovery link.'
            : loginRole === 'artist'
            ? 'Access your creator atelier, list artworks, and manage sales.'
            : 'Access your collection, track acquisitions, and view orders.'}
        </p>

        {!isForgot && (
          <>
            <div className="mt-6">
              <GoogleAuthButton
                role={loginRole}
                label={
                  loginRole === 'artist'
                    ? 'Continue with Google as Artist'
                    : 'Continue with Google as Collector'
                }
              />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-xs uppercase tracking-wider text-white/40">or with email</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
          </>
        )}

        {infoMsg && (
          <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </label>

          {!isForgot && (
            <label className="block">
              <div className="flex items-center justify-between">
                <span className={labelClass}>Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true);
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p>{errorMsg}</p>
              {errorMsg.includes('not confirmed') && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-2 text-xs font-semibold text-amber-400 underline hover:text-amber-300"
                >
                  {resending ? 'Resending…' : 'Click here to resend confirmation link'}
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className={primaryButton}>
            {loading
              ? isForgot
                ? 'Sending reset link…'
                : 'Logging in…'
              : isForgot
              ? 'Send Reset Link'
              : loginRole === 'artist'
              ? 'Enter Studio Dashboard'
              : 'Log in as Collector'}
          </button>

          {isForgot && (
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setErrorMsg('');
                setInfoMsg('');
              }}
              className="mt-2 w-full text-center text-xs text-slate-400 hover:text-white transition"
            >
              ← Back to Log In
            </button>
          )}
        </form>

        {!isForgot && (
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-ink/60">
            {loginRole === 'artist' ? (
              <p>
                Not registered as an artist yet?{' '}
                <Link href="/artist-signup" className="font-semibold text-brand hover:underline">
                  Create artist atelier
                </Link>
              </p>
            ) : (
              <p>
                New collector?{' '}
                <Link href="/customer-signup" className="font-semibold text-brand hover:underline">
                  Create a buyer account
                </Link>
                {' · Or want to sell? '}
                <button
                  type="button"
                  onClick={() => setLoginRole('artist')}
                  className="font-semibold text-amber-400 hover:underline"
                >
                  Switch to Artist Login
                </button>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-white/[0.06] pt-4 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition"
          >
            <span>🔒</span>
            <span>Platform Owner Admin Portal</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
