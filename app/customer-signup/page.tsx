'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';

export default function CustomerSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirm' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, role: 'customer', address: form.address } },
    });

    if (error || !data.user) {
      setStatus('error');
      setErrorMsg(error?.message ?? 'Something went wrong creating your account.');
      return;
    }

    if (data.session) router.push('/');
    else setStatus('confirm');
  }

  if (status === 'confirm') {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-3 text-ink/70">
          We sent a link to confirm your account. After that, <Link href="/login" className="font-semibold text-brand hover:underline">log in</Link> to start browsing.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Join Artelio</h1>
        <p className="mt-1 text-sm text-ink/60">Free to browse and buy original art.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className={labelClass}>Full name <span className="text-clay">*</span></span>
            <input type="text" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelClass}>Email <span className="text-clay">*</span></span>
            <input type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelClass}>Password <span className="text-clay">*</span></span>
            <input type="password" required minLength={6} className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelClass}>Shipping address</span>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>

          {errorMsg && <p className="text-sm text-clay">{errorMsg}</p>}

          <button type="submit" disabled={status === 'loading'} className={primaryButton}>
            {status === 'loading' ? 'Setting up your account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
