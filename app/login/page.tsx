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
          setErrorMsg('Invalid username/email or password. Use password123 for test accounts or click 1-Click Fast Login below.');
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

  async function handleQuickLogin(targetEmail: string, targetPass: string = 'password123') {
    setEmail(targetEmail);
    setPassword(targetPass);
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPass,
      });

      if (error || !data.user) {
        throw error || new Error('Sign in failed');
      }

      await handlePostLoginRedirect(data.user, data.session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
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

      {/* Quick 1-Click Login for Development / Testing */}
      {!isForgot && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#F83758]/30 bg-[#FDF0F3]/60 p-3.5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#F83758] mb-2 flex items-center gap-1.5">
            <span>⚡</span> 1-Click Fast Login (Instant Access)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('bhosalegurudatta@gmail.com', 'password123')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-white bg-white hover:border-[#F83758] hover:shadow-xs transition text-left active:scale-95 disabled:opacity-50"
            >
              <span className="text-xs font-bold text-[#17223B]">👑 Admin</span>
              <span className="text-[10px] text-[#626262] truncate w-full">bhosalegurudatta</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('bhosalegurudatta2248663@gmail.com', 'password123')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-white bg-white hover:border-[#F83758] hover:shadow-xs transition text-left active:scale-95 disabled:opacity-50"
            >
              <span className="text-xs font-bold text-[#17223B]">🎨 Artist (Jack)</span>
              <span className="text-[10px] text-[#626262] truncate w-full">Studio Seller</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('bhosalegurudatta2007@gmail.com', 'password123')}
              className="flex flex-col items-start p-2.5 rounded-xl border border-white bg-white hover:border-[#F83758] hover:shadow-xs transition text-left active:scale-95 disabled:opacity-50"
            >
              <span className="text-xs font-bold text-[#17223B]">🛍️ Collector</span>
              <span className="text-[10px] text-[#626262] truncate w-full">Buyer Account</span>
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#626262] text-center">
            Password: <code className="font-mono font-bold text-[#17223B]">password123</code>
          </p>
        </div>
      )}

      {/* - OR Continue with - (Exact Figma Section) */}
      {!isForgot && (
        <div className="mt-8 text-center">
          <p className="text-xs text-[#626262] mb-4">- OR Continue with -</p>

          {/* Social Circles: Google, Apple, Facebook */}
          <div className="flex items-center justify-center gap-4">
            {/* Google Button */}
            <GoogleAuthButton compact={true} />

            {/* Apple Icon Button */}
            <button
              type="button"
              onClick={() => alert('Apple ID sign-in is available in iOS Safari or via Google Account.')}
              className="w-12 h-12 rounded-full border border-[#DEDBDB] bg-white flex items-center justify-center hover:border-[#F83758] hover:bg-[#FDF0F3] transition text-[#17223B] shadow-xs"
              title="Apple Sign In"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.94.04-2.07.63-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.05.08 2.09-.5 2.73-1.28z" />
              </svg>
            </button>

            {/* Facebook Icon Button */}
            <button
              type="button"
              onClick={() => alert('Facebook sign-in is connecting. Please use Google or Email.')}
              className="w-12 h-12 rounded-full border border-[#DEDBDB] bg-white flex items-center justify-center hover:border-[#F83758] hover:bg-[#FDF0F3] transition text-[#4392F9] shadow-xs"
              title="Facebook Sign In"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>

          {/* Bottom Link: "Create An Account Sign Up" */}
          <div className="mt-8 text-xs text-[#17223B]">
            <span>Create An Account </span>
            <Link href="/customer-signup" className="font-bold text-[#F83758] hover:underline ml-1">
              Sign Up
            </Link>
          </div>

          {/* Admin Command Portal Link */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/admin" className="text-[11px] text-[#A8A8A9] hover:text-[#F83758] transition">
              🔒 Admin Command Center
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
