'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PRESET_BUDGETS = [199, 299, 499, 999];
const PRESET_DAYS = [3, 7, 14, 30];

interface PromoteArtworkModalProps {
  artwork: {
    id: string;
    title: string;
    price: number;
    image_url?: string | null;
    medium?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromoteArtworkModal({
  artwork,
  isOpen,
  onClose,
  onSuccess,
}: PromoteArtworkModalProps) {
  const [budget, setBudget] = useState(299);
  const [days, setDays] = useState(7);
  const [customBudget, setCustomBudget] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !artwork) return null;

  async function handlePromoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!artwork) return;

    const currentArtwork = artwork;

    const finalBudget = customBudget ? Number(customBudget) : budget;
    const finalDays = customDays ? Number(customDays) : days;

    if (!finalBudget || finalBudget < 49) {
      setErrorMsg('Minimum promotion budget is ₹49.');
      return;
    }

    if (!finalDays || finalDays < 1) {
      setErrorMsg('Please choose at least 1 day for promotion.');
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Please log in to promote artworks.');
        setLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Create Razorpay order for promotion budget on the server
      const orderRes = await fetch('/api/promotions/order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          artworkId: currentArtwork.id,
          budget: finalBudget,
          days: finalDays,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMsg(orderData.error || 'Failed to initialize promotion payment.');
        setLoading(false);
        return;
      }

      // Ensure Razorpay script is loaded
      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const keyId = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 2. Open Razorpay payment gateway
      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Artelio Promoted Listing',
        description: `Promote "${currentArtwork.title}" for ${finalDays} days`,
        order_id: orderData.orderId,
        prefill: {
          name: sessionData.session?.user?.user_metadata?.name || 'Artist',
          email: sessionData.session?.user?.email || undefined,
        },
        handler: async function (response: any) {
          // 3. Verify payment signature on the server and insert promotion row
          try {
            const verifyRes = await fetch('/api/promotions/verify', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                artworkId: currentArtwork.id,
                budget: finalBudget,
                days: finalDays,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setErrorMsg(verifyData.error || 'Payment received, but verification failed.');
              setLoading(false);
              return;
            }

            setLoading(false);
            onSuccess();
            onClose();
          } catch {
            setErrorMsg('Verification failed. Please contact concierge support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: '#F59E0B',
        },
      });

      rzp.open();
    } catch (err: any) {
      console.error('Promotion error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  const activeBudget = customBudget ? Number(customBudget) : budget;
  const activeDays = customDays ? Number(customDays) : days;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121826] p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 font-bold text-base">
              ★
            </span>
            <div>
              <h2 className="text-lg font-bold">Promote Artwork</h2>
              <p className="text-xs text-white/60">Feature at the top of Browse &amp; Home Page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Selected Artwork Summary */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div
            className="h-14 w-14 shrink-0 rounded-lg bg-paper bg-cover bg-center border border-white/10"
            style={artwork.image_url ? { backgroundImage: `url(${artwork.image_url})` } : undefined}
          />
          <div className="overflow-hidden">
            <h3 className="font-semibold text-sm truncate text-white">{artwork.title}</h3>
            <p className="text-xs text-white/50">{artwork.medium || 'Fine Art'}</p>
            <p className="text-xs font-mono font-bold text-marigold mt-0.5">
              ₹{Number(artwork.price).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Value Proposition Note (Fixed fee only) */}
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <div className="font-semibold flex items-center gap-1.5 text-amber-300">
            <span>💎</span> Fixed Fee Only • No Per-Click Deductions
          </div>
          <p className="mt-1 text-white/70 text-[11px] leading-relaxed">
            Your piece receives top-of-gallery placement across Artelio for the full duration. Zero surprise per-click charges.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-vermilion/30 bg-vermilion/10 p-3 text-xs text-vermilion">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handlePromoteSubmit} className="mt-4 space-y-4">
          {/* Budget Selection */}
          <div>
            <label className="block text-xs font-semibold text-white/80">
              Select Promotion Budget (Fixed Fee)
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {PRESET_BUDGETS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setBudget(amt);
                    setCustomBudget('');
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition border ${
                    !customBudget && budget === amt
                      ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-sm'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">Custom:</span>
              <input
                type="number"
                min="49"
                placeholder="Or custom ₹ budget"
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-xs font-semibold text-white/80">
              Promotion Duration (Days)
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {PRESET_DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setDays(d);
                    setCustomDays('');
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition border ${
                    !customDays && days === d
                      ? 'border-brand bg-brand/20 text-brand-soft shadow-sm'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">Custom:</span>
              <input
                type="number"
                min="1"
                max="180"
                placeholder="Or custom days"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Total & Launch Action */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-white/50 block">Total Fixed Fee</span>
              <span className="text-lg font-mono font-bold text-amber-300">
                ₹{activeBudget ? activeBudget.toLocaleString('en-IN') : 0}
              </span>
              <span className="text-[11px] text-white/50 ml-1">
                ({activeDays} days)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || activeBudget < 49}
                className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? 'Initializing Razorpay...' : `Pay ₹${activeBudget} & Promote`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
