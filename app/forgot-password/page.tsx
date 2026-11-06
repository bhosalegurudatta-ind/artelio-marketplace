'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });

      if (error) throw error;
      setStatus('sent');
      setMsg('A reset link has been sent to your email address.');
    } catch (err: any) {
      setStatus('error');
      setMsg(err.message || 'Failed to send password reset email.');
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 md:py-24 text-[#17223B]">
      {/* Figma Screen 7: "Forgot password?" */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#17223B] tracking-tight">
          Forgot<br />password?
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] py-3.5 pl-11 pr-4 text-xs md:text-sm text-[#17223B] placeholder-[#626262] focus:bg-white focus:border-[#F83758] focus:outline-none focus:ring-1 focus:ring-[#F83758] transition"
          />
        </div>

        <p className="text-[12px] text-[#626262] leading-relaxed">
          <span className="text-[#F83758] font-bold">* </span>
          We will send you a message to set or reset your new password
        </p>

        {status === 'sent' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
            ✓ {msg}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-semibold">
            {msg}
          </div>
        )}

        {/* Figma Screen 7 Coral Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-[#F83758] hover:bg-[#E02244] py-3.5 text-sm font-bold text-white shadow-stylish-btn transition-all active:scale-[0.98] disabled:opacity-60 uppercase tracking-wide"
        >
          {status === 'loading' ? 'Sending…' : 'Submit'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-xs font-bold text-[#626262] hover:text-[#F83758] transition">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}
