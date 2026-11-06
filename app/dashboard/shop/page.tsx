'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ShopSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [artistId, setArtistId] = useState('');
  const [artistName, setArtistName] = useState('');
  const [shopName, setShopName] = useState('');
  const [about, setAbout] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  // Banner image states
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadShop() {
      setLoading(true);
      setErrorMsg('');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          router.push('/login?role=artist');
          return;
        }

        const res = await fetch('/api/shop', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to load shop profile.');
        } else if (data.shop) {
          const s = data.shop;
          setArtistId(s.id);
          setArtistName(s.name || '');
          setShopName(s.shop_name || '');
          setCurrentBannerUrl(s.banner_url || null);
          setAbout(s.about || s.bio || '');
          setShippingPolicy(s.shipping_policy || '');
          setReturnPolicy(s.return_policy || '');
        }
      } catch (err: any) {
        console.error('Error loading shop profile:', err);
        setErrorMsg(err.message || 'Error communicating with server.');
      } finally {
        setLoading(false);
      }
    }

    loadShop();
  }, [router]);

  // Handle banner preview URL
  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Banner must be a JPG, PNG or WebP image.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Banner image must be under 4 MB.');
      return;
    }

    setBannerFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Authentication token expired. Please log in again.');
        setSaving(false);
        return;
      }

      const form = new FormData();
      form.append('shop_name', shopName.trim());
      form.append('about', about.trim());
      form.append('shipping_policy', shippingPolicy.trim());
      form.append('return_policy', returnPolicy.trim());

      if (bannerFile) {
        form.append('banner', bannerFile);
      }

      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save shop settings.');
      } else {
        setSuccessMsg('Shop profile and policies updated successfully!');
        if (data.shop?.banner_url) {
          setCurrentBannerUrl(data.shop.banner_url);
          setBannerFile(null);
        }
      }
    } catch (err: any) {
      console.error('Save shop error:', err);
      setErrorMsg(err.message || 'Something went wrong saving your shop.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center text-white/60">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F83758] border-r-transparent mb-4" />
        <p className="text-sm">Loading your shop profile…</p>
      </main>
    );
  }

  const effectiveBanner = bannerPreviewUrl || currentBannerUrl;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 text-white">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-white/60 hover:text-white transition flex items-center gap-1.5 mb-2"
          >
            <span>&larr;</span> Back to Creator Dashboard
          </Link>
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
            Artist Shop Profile
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Customize your public atelier branding, header banner, artist bio, and collector policies.
          </p>
        </div>

        {artistId && (
          <Link
            href={`/artist/${artistId}`}
            target="_blank"
            className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🏪</span> View Public Shop ↗
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          ✓ {successMsg}
        </div>
      )}

      {/* Banner Preview Strip */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#121826] shadow-xl">
        <div className="relative h-44 w-full bg-gradient-to-r from-purple-900/60 via-brand/40 to-[#120726] sm:h-56">
          {effectiveBanner ? (
            <Image
              src={effectiveBanner}
              alt="Shop Banner"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
              No banner uploaded yet &bull; Recommended 1920 &times; 600 px (Max 4 MB)
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F83758] bg-black/60 px-2 py-0.5 rounded">
                Live Preview
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-white drop-shadow-md sm:text-3xl">
                {shopName || artistName || 'Your Shop Name'}
              </h2>
              <p className="text-xs text-white/70">by {artistName || 'Artist'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-[#121826] p-6 sm:p-8">
        {/* 1. Shop Name */}
        <div>
          <label htmlFor="shopName" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Shop / Atelier Name
          </label>
          <input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder={`e.g. ${artistName ? `${artistName} Fine Art Studio` : 'Serene Canvas Atelier'}`}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
          />
          <p className="mt-1 text-[11px] text-white/40">
            If left blank, your personal artist name ({artistName || 'Artist'}) will be displayed as the shop title.
          </p>
        </div>

        {/* 2. Banner Image Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            Shop Banner Image (JPG, PNG or WebP &bull; Max 4 MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleBannerSelect}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white file:mr-4 file:rounded-lg file:border-0 file:bg-[#F83758] file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#E02244] file:cursor-pointer transition"
          />
          {bannerFile && (
            <p className="mt-1.5 text-xs text-emerald-400 font-semibold">
              Selected: {bannerFile.name} ({(bannerFile.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* 3. About the Artist / Studio */}
        <div>
          <label htmlFor="about" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
            About the Atelier / Artist Story
          </label>
          <textarea
            id="about"
            rows={5}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Describe your creative vision, studio inspiration, traditional or modern mediums used, and background..."
            className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition leading-relaxed"
          />
          <p className="mt-1 text-[11px] text-white/40">
            This narrative appears prominently on your shop page to build trust with high-value collectors.
          </p>
        </div>

        {/* 4. Shipping & Packaging Policy */}
        <div>
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-1 mb-2">
            <label htmlFor="shippingPolicy" className="block text-xs font-bold uppercase tracking-wider text-white/70">
              Shipping &amp; Packaging Policy
            </label>
            <button
              type="button"
              onClick={() =>
                setShippingPolicy(
                  'All original pieces are packed with museum-grade protective glassine paper, heavy-duty edge guards, and waterproof bubble armor. Physical pieces are dispatched within 2–3 business days via insured white-glove courier partners with tracking number provided.'
                )
              }
              className="text-[11px] text-[#4392F9] hover:underline"
            >
              Insert Standard Packaging Policy
            </button>
          </div>
          <textarea
            id="shippingPolicy"
            rows={3}
            value={shippingPolicy}
            onChange={(e) => setShippingPolicy(e.target.value)}
            placeholder="Explain dispatch timelines, protective packaging, courier insurance, and delivery expectations..."
            className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
          />
        </div>

        {/* 5. Return & Cancellation Policy */}
        <div>
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-1 mb-2">
            <label htmlFor="returnPolicy" className="block text-xs font-bold uppercase tracking-wider text-white/70">
              Return &amp; Damage Guarantee Policy
            </label>
            <button
              type="button"
              onClick={() =>
                setReturnPolicy(
                  'We offer a 48-hour satisfaction inspection window upon delivery. In the rare event of damage during transit, photograph the parcel and file a report in your Orders portal to receive an immediate replacement or full escrow refund.'
                )
              }
              className="text-[11px] text-[#4392F9] hover:underline"
            >
              Insert Standard Escrow Guarantee Policy
            </button>
          </div>
          <textarea
            id="returnPolicy"
            rows={3}
            value={returnPolicy}
            onChange={(e) => setReturnPolicy(e.target.value)}
            placeholder="Explain inspection period, transit damage guarantees, and customer return procedures..."
            className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-white/30 focus:border-[#F83758] focus:outline-none transition"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-[#F83758] to-[#E02244] px-7 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving Shop...' : 'Save Shop Profile'}
          </button>
        </div>
      </form>
    </main>
  );
}
