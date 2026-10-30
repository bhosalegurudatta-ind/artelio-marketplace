'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';

export default function UploadArtwork() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', medium: '', price: '' });
  const [dimensions, setDimensions] = useState('');
  const [framing, setFraming] = useState('Stretched Canvas (Ready to Hang)');
  const [editionType, setEditionType] = useState('1 of 1 Unique Original');
  const [editionRun, setEditionRun] = useState('25');
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

    let fullDescription = form.description;
    const specs: string[] = [];
    if (dimensions.trim()) specs.push(`Dimensions: ${dimensions.trim()}`);
    if (!isDigital && framing) specs.push(`Presentation: ${framing}`);
    if (editionType === 'Limited Edition' && editionRun.trim()) {
      specs.push(`Edition: Limited Edition of ${editionRun.trim()} prints`);
    } else if (editionType) {
      specs.push(`Edition: ${editionType}`);
    }

    if (specs.length > 0) {
      fullDescription = fullDescription
        ? `${fullDescription}\n\n✦ Curatorial Specifications:\n• ${specs.join('\n• ')}`
        : `✦ Curatorial Specifications:\n• ${specs.join('\n• ')}`;
    }

    let fullMedium = form.medium;
    if (dimensions.trim()) {
      fullMedium = fullMedium ? `${fullMedium} (${dimensions.trim()})` : dimensions.trim();
    }

    const body = new FormData();
    body.append('image', file);
    body.append('title', form.title);
    body.append('description', fullDescription);
    body.append('medium', fullMedium);
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
    if (data.id) {
      router.push(`/artwork/${data.id}`);
    } else {
      router.push('/browse');
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-2xl font-bold text-ink md:text-3xl font-serif">List Artwork for Sale</h1>
      <p className="mt-2 text-sm text-ink/60">
        Open to all creators, artists, and collectors. Buyers see a watermarked preview; full-resolution files are secured in private escrow storage.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Medium</span>
            <input type="text" placeholder="e.g. Oil on Belgian Linen" className={inputClass} value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} />
          </label>

          <label className="block">
            <span className={labelClass}>Physical Dimensions</span>
            <input type="text" placeholder="e.g. 24 × 36 in (60 × 90 cm)" className={inputClass} value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Edition Classification</span>
            <select
              className={inputClass}
              value={editionType}
              onChange={(e) => setEditionType(e.target.value)}
            >
              <option value="1 of 1 Unique Original">1 of 1 Unique Original</option>
              <option value="Limited Edition">Limited Edition Print Run</option>
              <option value="Open Edition">Open Edition</option>
            </select>
          </label>

          {editionType === 'Limited Edition' ? (
            <label className="block">
              <span className={labelClass}>Total Edition Size</span>
              <input
                type="number"
                min={2}
                max={500}
                placeholder="e.g. 50"
                className={inputClass}
                value={editionRun}
                onChange={(e) => setEditionRun(e.target.value)}
              />
            </label>
          ) : (
            <label className="block">
              <span className={labelClass}>Presentation / Mounting</span>
              <select
                className={inputClass}
                value={framing}
                onChange={(e) => setFraming(e.target.value)}
                disabled={isDigital}
              >
                <option value="Stretched Canvas (Ready to Hang)">Stretched Canvas (Ready to Hang)</option>
                <option value="Custom Gallery Framed">Custom Gallery Framed</option>
                <option value="Rolled in Heavy PVC Tube">Rolled in Heavy PVC Tube</option>
                <option value="Unframed Archival Board">Unframed Archival Board</option>
              </select>
            </label>
          )}
        </div>

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
