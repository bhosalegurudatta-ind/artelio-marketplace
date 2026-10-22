'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';

export default function UploadArtwork() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', medium: '', price: '' });
  const [isDigital, setIsDigital] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [priceHint, setPriceHint] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function handleAiSuggest() {
    if (!file) return;
    setAiLoading(true);
    setAiMsg('');
    setPriceHint('');

    const token = await getToken();
    if (!token) {
      setAiMsg('Please log in to use the AI assistant.');
      setAiLoading(false);
      return;
    }

    const body = new FormData();
    body.append('image', file);
    const res = await fetch('/api/ai-listing', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    const data = await res.json();

    if (!res.ok) {
      setAiMsg(data.error ?? 'The AI assistant could not help this time.');
      setAiLoading(false);
      return;
    }

    // Fill the form, but never overwrite what the artist already typed.
    setForm((f) => ({
      ...f,
      title: f.title || data.title,
      description: f.description || data.description,
      medium: f.medium || data.medium,
    }));
    if (data.price_min && data.price_max) {
      setPriceHint(
        `AI estimate: ₹${data.price_min.toLocaleString('en-IN')} to ₹${data.price_max.toLocaleString('en-IN')}. This is a rough guess from the image only, so you know your work best.`
      );
    }
    setAiMsg('Suggestions added below. Edit anything you like before listing.');
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please choose an image of your artwork.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    const token = await getToken();
    if (!token) {
      setErrorMsg('You need to be logged in to upload artwork.');
      setStatus('error');
      return;
    }

    const body = new FormData();
    body.append('image', file);
    body.append('title', form.title);
    body.append('description', form.description);
    body.append('medium', form.medium);
    body.append('price', form.price);
    body.append('isDigital', String(isDigital));
    body.append('isAiAssisted', String(isAi));

    const res = await fetch('/api/artworks', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Could not list your artwork.');
      setStatus('error');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-2xl font-bold text-ink md:text-3xl">Upload a new piece</h1>
      <p className="mt-2 text-sm text-ink/60">
        Buyers see a smaller, watermarked preview. Your full-quality file is never published.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className={labelClass}>Image <span className="text-clay">*</span></span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setAiMsg('');
              setPriceHint('');
            }}
          />
          <span className="mt-1.5 block text-xs text-ink/50">JPG, PNG or WebP, up to 4 MB.</span>
        </label>

        {previewUrl && (
          <div className="flex items-start gap-4 rounded-xl border border-ink/10 bg-paper p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Selected artwork" className="h-28 w-24 rounded-lg object-cover" />
            <div>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="rounded-full bg-gradient-to-r from-purple-600 via-brand to-magenta px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow-art-glow hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {aiLoading ? 'Looking at your artwork…' : '✨ Suggest title, description & price with Gemini AI'}
              </button>
              {aiMsg && <p className="mt-2 text-xs text-ink/60">{aiMsg}</p>}
            </div>
          </div>
        )}

        <label className="block">
          <span className={labelClass}>Title <span className="text-clay">*</span></span>
          <input type="text" required maxLength={120} className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>

        <label className="block">
          <span className={labelClass}>Description</span>
          <textarea rows={4} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <label className="block">
          <span className={labelClass}>Medium</span>
          <input type="text" placeholder="e.g. Oil on canvas, Digital print" className={inputClass} value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} />
        </label>

        <label className="block">
          <span className={labelClass}>Price (₹) <span className="text-clay">*</span></span>
          <input type="number" required min={1} className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          {priceHint && <span className="mt-1.5 block text-xs text-brand-dark">{priceHint}</span>}
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4">
          <input type="checkbox" checked={isDigital} onChange={(e) => setIsDigital(e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
          <span className="text-sm text-ink/80">
            <span className="font-semibold text-ink">This is a digital artwork.</span> Buyers can download your full-quality file after they pay, and it can sell more than once. Leave unticked for a physical, one-off piece that you will ship yourself.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4">
          <input type="checkbox" checked={isAi} onChange={(e) => setIsAi(e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
          <span className="text-sm text-ink/80">
            <span className="font-semibold text-ink">This work is AI-assisted.</span> Tick this if AI helped create any part of the piece. Otherwise it is listed as an original. Buyers see this label.
          </span>
        </label>

        {errorMsg && <p className="text-sm text-clay">{errorMsg}</p>}

        <button type="submit" disabled={status === 'loading'} className={primaryButton}>
          {status === 'loading' ? 'Checking and uploading…' : 'List this artwork'}
        </button>
      </form>
    </main>
  );
}
