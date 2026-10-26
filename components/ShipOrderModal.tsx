'use client';

import { useState } from 'react';

const POPULAR_COURIERS = [
  'Delhivery',
  'Blue Dart',
  'DTDC',
  'India Post (Speed Post)',
  'Trackon',
  'DHL Express',
];

export default function ShipOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [courierName, setCourierName] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!trackingNumber.trim()) {
      setErrorMsg('Please enter the Tracking Number / AWB provided by your courier.');
      return;
    }

    setSubmitting(true);

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch(`/api/orders/${order.id}/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courierName,
          trackingNote: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to mark as shipped.');
        setSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121826] p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">Fulfill & Mark Shipped</h2>
            <p className="text-xs text-white/60">Artwork: {order.artworks?.title}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-vermilion/30 bg-vermilion/10 p-3 text-xs text-vermilion">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/80">Courier Service</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_COURIERS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCourierName(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    courierName === c
                      ? 'bg-brand text-white font-semibold'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="Or type custom courier name"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80">
              Tracking Number / AWB *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DL123456789IN or 982341209"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-white/40">
              This will be shared with the collector so they can track delivery.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80">
              Tracking URL (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://www.delhivery.com/track/package/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white/60">
            ℹ️ <span className="font-semibold text-white">Escrow Notice:</span> Payout automatically unlocks 10 days after dispatch, or immediately once the collector confirms receipt in their portal.
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all disabled:opacity-50"
            >
              {submitting ? 'Confirming Dispatch…' : 'Confirm Dispatch & Notify Buyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
