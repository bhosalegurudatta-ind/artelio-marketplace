'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function ArtistSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirm' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    setResendNotice('');

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name: form.name, role: 'artist', bio: form.bio },
      },
    });

    if (error || !data.user) {
      setStatus('error');
      setErrorMsg(error?.message ?? 'Something went wrong creating your artist account.');
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
      } catch {
        // Fallback
      }
      router.push('/dashboard');
      router.refresh();
    } else {
      setStatus('confirm');
    }
  }

  async function handleResend() {
    setResending(true);
    setResendNotice('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setResendNotice('Confirmation link resent! Please check your inbox or spam folder.');
    } catch (err: any) {
      setResendNotice(err.message || 'Could not resend email yet. Please wait a moment.');
    } finally {
      setResending(false);
    }
  }

  if (status === 'confirm') {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="rounded-2xl border border-[#DEDBDB] bg-white p-8 shadow-stylish-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF0F3] text-[#F83758]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#17223B]">Check your email</h1>
          <p className="mt-3 text-xs text-[#626262]">
            We sent an atelier verification link to <strong className="text-[#17223B]">{form.email}</strong>. Once confirmed, you can log in to open your studio dashboard.
          </p>

          {resendNotice && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              {resendNotice}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full text-xs font-bold text-[#F83758] underline hover:text-[#E02244] transition"
            >
              {resending ? 'Sending…' : "Didn't receive the email? Click to resend"}
            </button>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
              >
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12 md:py-16">
      {/* Figma Screen 6 Style: "Create an account" */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#17223B] tracking-tight">
          Create an<br />Artist Atelier
        </h1>
        <p className="mt-2 text-xs text-[#626262]">
          Showcase original paintings, reach verified art buyers, and receive direct UPI payouts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626262]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Artist / Studio Name"
            className="w-full rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] py-3 pl-11 pr-4 text-xs md:text-sm text-[#17223B] placeholder-[#626262] focus:bg-white focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
          />
        </div>

        {/* Email input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626262]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email Address"
            className="w-full rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] py-3 pl-11 pr-4 text-xs md:text-sm text-[#17223B] placeholder-[#626262] focus:bg-white focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
          />
        </div>

        {/* Password input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626262]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password (minimum 6 characters)"
            className="w-full rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] py-3 pl-11 pr-4 text-xs md:text-sm text-[#17223B] placeholder-[#626262] focus:bg-white focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
          />
        </div>

        {/* Bio textarea */}
        <div>
          <textarea
            rows={2}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Short Studio Bio / Mediums (e.g. Oil on Canvas, Digital, Watercolors)"
            className="w-full rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] p-3 text-xs md:text-sm text-[#17223B] placeholder-[#626262] focus:bg-white focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition resize-none"
          />
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-semibold">
            {errorMsg}
          </div>
        )}

        <p className="text-[11px] text-[#626262] leading-tight">
          By registering an Artist Atelier, you agree to our{' '}
          <Link href="/terms" className="text-[#F83758] underline">
            Terms
          </Link>{' '}
          and acknowledge verified artist UPI payouts.
        </p>

        {/* Figma Screen 6 Coral Button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-[#F83758] hover:bg-[#E02244] py-3.5 text-sm font-bold text-white shadow-stylish-btn transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {status === 'loading' ? 'Creating Atelier…' : 'Create Artist Account'}
        </button>
      </form>

      {/* - OR Continue with - */}
      <div className="my-6 flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-[#DEDBDB]" />
        <span className="text-xs text-[#626262]">- OR Continue with -</span>
        <div className="h-px flex-1 bg-[#DEDBDB]" />
      </div>

      <div className="flex justify-center">
        <GoogleAuthButton role="artist" label="Sign up as Artist with Google" />
      </div>

      <p className="mt-8 text-center text-xs text-[#626262]">
        I Already Have an Account{' '}
        <Link href="/login" className="font-bold text-[#F83758] hover:underline">
          Login
        </Link>
      </p>
    </main>
  );
}
