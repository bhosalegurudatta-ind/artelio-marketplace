'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (isForgot) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        const msg = error?.message || 'Could not log you in.';
        if (msg.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Your email address has not been confirmed yet.');
        } else if (msg.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please verify and try again.');
        } else {
          setErrorMsg(msg);
        }
        setLoading(false);
        return;
      }

      // Check whether user is Owner, Artist, or Collector
      if (data.user.email === 'bhosalegurudatta@gmail.com') {
        router.push('/admin');
        router.refresh();
        return;
      }

      let userRole = 'customer';
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (dbUser?.role) {
          userRole = dbUser.role;
        } else if (data.session) {
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.session.access_token}`,
            },
          });
          const syncData = await res.json().catch(() => ({}));
          userRole = syncData?.profile?.role || 'customer';
        }
      } catch {
        // Fallback
      }

      // Automatically route user to their respective home
      if (userRole === 'artist') {
        router.push('/dashboard');
      } else {
        router.push('/profile');
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during login.');
      setLoading(false);
    }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F1420]/90 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-serif text-2xl font-black shadow-lg shadow-amber-500/20">
              A
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
              {isForgot ? 'Reset Password' : 'Sign In to Artelio'}
            </h1>
            <p className="mt-2 text-xs text-slate-400">
              {isForgot
                ? 'Enter your registered email and we will send a password reset link.'
                : 'Welcome back. Access your personal collection, orders, or artist studio.'}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <div className="flex items-start justify-between gap-2">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg('')}
                  className="text-red-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {errorMsg.toLowerCase().includes('not confirmed') && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-2 text-xs font-semibold text-amber-400 underline hover:text-amber-300"
                >
                  {resending ? 'Resending email…' : 'Resend confirmation link'}
                </button>
              )}
            </div>
          )}

          {infoMsg && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300">
              ✓ {infoMsg}
            </div>
          )}

          {/* 1-Click Google OAuth */}
          {!isForgot && (
            <div className="mb-6">
              <GoogleAuthButton label="Continue with Google" />
              <div className="relative mt-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-[#0F1420] px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  or sign in with email
                </span>
              </div>
            </div>
          )}

          {/* Login / Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-r-transparent" />
                  <span>{isForgot ? 'Sending reset link…' : 'Signing in…'}</span>
                </>
              ) : (
                <span>{isForgot ? 'Send Password Reset Link' : 'Sign In →'}</span>
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition mt-2"
              >
                ← Return to Sign In
              </button>
            )}
          </form>

          {/* Account Creation Switcher */}
          {!isForgot && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-center text-xs text-slate-400 mb-3">
                Don't have an account yet?
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/customer-signup"
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-2.5 text-center transition group"
                >
                  <span className="block text-xs font-semibold text-white group-hover:text-amber-400 transition">
                    🖼️ Collector
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Buy & collect art
                  </span>
                </Link>

                <Link
                  href="/artist-signup"
                  className="rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 p-2.5 text-center transition group"
                >
                  <span className="block text-xs font-semibold text-amber-300 group-hover:text-amber-200 transition">
                    🎨 Artist Atelier
                  </span>
                  <span className="block text-[10px] text-amber-400/70 mt-0.5">
                    Sell your artwork
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Admin Command Portal Link */}
          <div className="mt-6 border-t border-white/[0.06] pt-4 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-amber-400 transition font-mono"
            >
              <span>🔒</span>
              <span>Platform Owner Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
