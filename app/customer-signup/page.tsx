'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function CustomerSignup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirm' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name: email.split('@')[0], role: 'customer' },
      },
    });

    if (error || !data.user) {
      setStatus('error');
      setErrorMsg(error?.message ?? 'Something went wrong creating your account.');
      return;
    }

    if (data.session) {
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });
      } catch {}
      router.push('/');
      router.refresh();
    } else {
      setStatus('confirm');
    }
  }

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-sm sm:max-w-md">
        
        {/* Header - Matching Figma Screen 6 "Create an account" */}
        <div className="mb-8">
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-[#17223B] tracking-tight">
            Create an{'\n'}account
          </h1>
        </div>

        {status === 'confirm' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <span className="text-3xl block mb-2">✉️</span>
            <h2 className="font-bold text-lg text-emerald-800">Check Your Email</h2>
            <p className="mt-2 text-xs text-emerald-700 leading-relaxed">
              We have sent an authentication link to <strong>{email}</strong>. Please click the link in your inbox to confirm your account.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn"
            >
              Go to Login →
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            {/* Form with exact Figma styling: #F3F3F3 with left icons */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username or Email */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full rounded-xl border border-[#DEDBDB] bg-[#F3F3F3] focus:bg-white pl-11 pr-4 py-3.5 text-sm text-[#17223B] placeholder-[#626262] focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
                />
              </div>

              {/* Password */}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-[#DEDBDB] bg-[#F3F3F3] focus:bg-white pl-11 pr-11 py-3.5 text-sm text-[#17223B] placeholder-[#626262] focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#626262] hover:text-[#17223B] p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    ) : (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Confirm Password */}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full rounded-xl border border-[#DEDBDB] bg-[#F3F3F3] focus:bg-white pl-11 pr-4 py-3.5 text-sm text-[#17223B] placeholder-[#626262] focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
                />
              </div>

              {/* Legal Text (from Figma Screen 6) */}
              <p className="text-[11px] text-[#626262] leading-tight">
                By clicking the <span className="text-[#F83758]">Register</span> button, you agree to the public offer
              </p>

              {/* Large Red Create Account Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-md bg-[#F83758] hover:bg-[#E02244] py-3.5 text-sm font-bold text-white shadow-stylish-btn transition active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {status === 'loading' ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            {/* - OR Continue with - */}
            <div className="mt-8 text-center">
              <p className="text-xs text-[#626262] mb-4">- OR Continue with -</p>

              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[#F83758] flex items-center justify-center hover:bg-[#FDF0F3] transition p-1">
                  <GoogleAuthButton label="" />
                </div>
                <button
                  type="button"
                  onClick={() => alert('Apple ID sign-in is available in iOS Safari or via Google Account.')}
                  className="w-12 h-12 rounded-full border border-[#F83758] flex items-center justify-center hover:bg-[#FDF0F3] transition text-[#17223B]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.94.04-2.07.63-2.73 1.4-.58.68-1.1 1.77-.96 2.84 1.05.08 2.09-.5 2.73-1.28z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => alert('Facebook sign-in is connecting. Please use Google or Email.')}
                  className="w-12 h-12 rounded-full border border-[#F83758] flex items-center justify-center hover:bg-[#FDF0F3] transition text-[#4392F9]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>

              {/* Bottom Link: "I Already Have An Account Login" */}
              <div className="mt-8 text-xs text-[#17223B]">
                <span>I Already Have An Account </span>
                <Link href="/login" className="font-bold text-[#F83758] hover:underline ml-1">
                  Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
