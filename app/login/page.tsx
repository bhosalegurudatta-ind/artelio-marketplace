'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setErrorMsg(error?.message ?? 'Could not log you in.');
      setLoading(false);
      return;
    }

    // Artists land in their studio, buyers on the homepage.
    const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    router.push(profile?.role === 'artist' ? '/dashboard' : '/');
  }

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-2xl border border-white/10 bg-[#121826] p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-serif font-bold text-white">Log in</h1>
        <p className="mt-1 text-sm text-white/60">Welcome back to Artelio.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className={labelClass}>Email</span>
            <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {errorMsg && <p className="text-sm text-clay">{errorMsg}</p>}

          <button type="submit" disabled={loading} className={primaryButton}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          New here?{' '}
          <Link href="/customer-signup" className="font-semibold text-brand hover:underline">Create a buyer account</Link>
          {' or '}
          <Link href="/artist-signup" className="font-semibold text-brand hover:underline">sell your art</Link>
        </p>
      </div>
    </main>
  );
}
