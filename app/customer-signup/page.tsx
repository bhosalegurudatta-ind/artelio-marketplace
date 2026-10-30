'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function CustomerSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
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
        data: { name: form.name, role: 'customer', address: form.address },
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
      } catch {
        // Continue to home
      }
      router.push('/');
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
      setResendNotice('Confirmation link resent! Please check your spam folder if not in inbox.');
    } catch (err: any) {
      setResendNotice(err.message || 'Could not resend email yet. Please wait a moment.');
    } finally {
      setResending(false);
    }
  }

  if (status === 'confirm') {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-8 shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Check your email</h1>
          <p className="mt-3 text-sm text-slate-300">
            We sent a verification link to <strong className="text-white">{form.email}</strong>. Tap the link in your email to instantly verify your collector account.
          </p>

          {resendNotice && (
            <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              {resendNotice}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full text-xs text-amber-400 underline hover:text-amber-300 transition"
            >
              {resending ? 'Sending…' : "Didn't receive the email? Click to resend"}
            </button>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block rounded-full bg-white/10 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
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
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border border-white/10 bg-[#121826] p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-serif font-bold text-white">Join Artelio</h1>
        <p className="mt-1 text-sm text-white/60">Free to browse and acquire original art.</p>

        <div className="mt-6">
          <GoogleAuthButton label="Sign up with Google" />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10"></div>
          <span className="text-xs uppercase tracking-wider text-white/40">or with email</span>
          <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Full name <span className="text-clay">*</span></span>
            <input type="text" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          </label>
          <label className="block">
            <span className={labelClass}>Email <span className="text-clay">*</span></span>
            <input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@domain.com" />
          </label>
          <label className="block">
            <span className={labelClass}>Password <span className="text-clay">*</span></span>
            <input type="password" required minLength={6} className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </label>
          <label className="block">
            <span className={labelClass}>Shipping address</span>
            <textarea rows={2} className={`${inputClass} resize-none`} placeholder="City, State, Postal code" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>

          {errorMsg && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={status === 'loading'} className={primaryButton}>
            {status === 'loading' ? 'Setting up your account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
