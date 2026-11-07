'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoogleAuthButton from '@/components/GoogleAuthButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resending, setResending] = useState(false);

  async function handlePostLoginRedirect(user: any, session: any) {
    if (redirectTarget) {
      router.push(redirectTarget);
      router.refresh();
      return;
    }

    if (user.email === 'bhosalegurudatta@gmail.com') {
      router.push('/admin');
      router.refresh();
      return;
    }

    let userRole = 'customer';
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (dbUser?.role) {
        userRole = dbUser.role;
      } else if (session) {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const syncData = await res.json().catch(() => ({}));
        userRole = syncData?.profile?.role || 'customer';
      }
    } catch {}

    if (userRole === 'artist') {
      router.push('/dashboard');
    } else {
      router.push('/profile');
    }
    router.refresh();
  }

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
        setInfoMsg('We will send you a message to set or reset your new password. Please check your email inbox.');
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
          setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
        } else {
          setErrorMsg(msg);
        }
        setLoading(false);
        return;
      }

      await handlePostLoginRedirect(data.user, data.session);
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
      setInfoMsg('Confirmation email resent! Please check your inbox.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md">
      {/* Header - Matching Figma Screen 5 "Welcome Back!" & Screen 7 "Forgot password?" */}
      <div className="mb-8">
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-[#17223B] tracking-tight">
          {isForgot ? 'Forgot\npassword?' : 'Welcome\nBack!'}
        </h1>
        {isForgot && (
          <p className="mt-2 text-xs text-[#626262]">
            * We will send you a message to set or reset your new password
          </p>
        )}
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <div className="flex items-start justify-between gap-2">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 font-bold">✕</button>
          </div>
          {errorMsg.toLowerCase().includes('not confirmed') && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="mt-2 text-xs font-semibold text-[#F83758] underline block"
            >
              {resending ? 'Resending email…' : 'Resend confirmation link'}
            </button>
          )}
        </div>
      )}

      {infoMsg && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          ✓ {infoMsg}
        </div>
      )}

      {/* Form matching Figma input boxes: #F3F3F3 with left icons */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username / Email input with user icon */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#626262]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isForgot ? 'Enter your email address' : 'Username or Email'}
            className="w-full rounded-xl border border-[#DEDBDB] bg-[#F3F3F3] focus:bg-white pl-11 pr-4 py-3.5 text-sm text-[#17223B] placeholder-[#626262] focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
          />
        </div>

        {/* Password input with lock icon & eye toggle */}
        {!isForgot && (
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#626262]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-[#DEDBDB] bg-[#F3F3F3] focus:bg-white pl-11 pr-11 py-3.5 text-sm text-[#17223B] placeholder-[#626262] focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#626262] hover:text-[#17223B] p-1"
                title={showPassword ? 'Hide' : 'Show'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {/* Forgot Password Link (right-aligned in red `#F83758`) */}
            <div className="text-right mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(true);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-xs font-semibold text-[#F83758] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        )}

        {/* Large Red Button (Matching Figma Button `#F83758`) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#F83758] hover:bg-[#E02244] py-3.5 text-sm font-bold text-white shadow-stylish-btn transition active:scale-[0.98] disabled:opacity-50 mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>{isForgot ? 'Sending…' : 'Logging in…'}</span>
            </span>
          ) : (
            <span>{isForgot ? 'Submit' : 'Login'}</span>
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
            className="w-full text-center text-xs text-[#626262] hover:text-[#17223B] mt-2 block"
          >
            ← Back to Login
          </button>
        )}
      </form>

      {/* - OR Continue with Google - */}
      {!isForgot && (
        <div className="mt-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DEDBDB]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-[#626262] font-medium">OR Continue with</span>
            </div>
          </div>

          {/* Full-width Google Sign-In Button */}
          <div className="w-full pt-1">
            <GoogleAuthButton compact={false} label="Continue with Google" />
          </div>

          {/* Bottom Link: "Create An Account Sign Up" */}
          <div className="pt-4 text-xs text-[#17223B]">
            <span>Don&apos;t have an account? </span>
            <Link href="/customer-signup" className="font-bold text-[#F83758] hover:underline ml-1">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-white">
      <Suspense fallback={<div className="text-center text-xs text-gray-400">Loading login…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
