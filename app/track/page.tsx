'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CertificateModal from '@/components/CertificateModal';
import InvoiceModal from '@/components/InvoiceModal';

type TrackedOrder = {
  id: string;
  created_at: string;
  status: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  courier_name?: string | null;
  tracking_note?: string | null;
  tracking_url?: string | null;
  shipping_name?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  artwork?: {
    id: string;
    title: string;
    price: number;
    medium?: string | null;
    imageUrl?: string | null;
    isDigital?: boolean;
    artistName?: string;
  } | null;
};

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('order_id') || '';

  const [orderId, setOrderId] = useState(initialId);
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [coaData, setCoaData] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!orderId.trim()) {
      setErrorMsg('Please enter your Order ID.');
      return;
    }
    if (!contact.trim()) {
      setErrorMsg('Please enter the mobile number or email used during purchase.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim(), contact: contact.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Could not locate tracking information.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setErrorMsg('Unable to reach the tracking concierge. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  const art = order?.artwork;
  const isDelivered = order?.status === 'delivered';
  const isShipped = order?.status === 'shipped';
  const isPaid = order?.status === 'paid';

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300 mb-3">
          <span>📦</span> Fine Art Courier Logistics
        </div>
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
          Track Your Artwork
        </h1>
        <p className="mt-2 text-xs md:text-sm text-white/60">
          Real-time courier milestones, unboxing inspection status, and Certificate of Authenticity lookup.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 md:p-8 shadow-2xl backdrop-blur-md mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Order ID <span className="text-clay">*</span>
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 7f12e8a4 or full Order ID"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              Phone Number or Email <span className="text-clay">*</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Mobile number or email used at checkout"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-vermilion via-magenta to-brand py-2.5 px-4 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all disabled:opacity-50"
            >
              {loading ? 'Tracking…' : 'Locate Order'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="mt-4 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay text-center font-medium">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Order Status Result */}
      {order && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 md:p-8 shadow-xl">
            {/* Header / ID */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-xs text-white/50">
                  ORDER #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <p className="text-xs text-white/60">
                  Acquired on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isDelivered
                      ? 'bg-malachite/20 text-malachite border border-malachite/30'
                      : isShipped
                      ? 'bg-brand/20 text-brand-soft border border-brand/30'
                      : 'bg-marigold/20 text-marigold border border-marigold/30'
                  }`}
                >
                  {isPaid ? 'Secured in Escrow' : order.status}
                </span>
              </div>
            </div>

            {/* Artwork & Destination Information */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="flex gap-4 md:col-span-7">
                <div
                  className="h-24 w-20 shrink-0 rounded-xl bg-paper bg-cover bg-center border border-white/10 shadow-md"
                  style={art?.imageUrl ? { backgroundImage: `url(${art.imageUrl})` } : undefined}
                />
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">{art?.title}</h2>
                  <p className="text-xs text-white/60">
                    by <strong className="text-white">{art?.artistName}</strong>
                  </p>
                  <p className="text-xs text-white/50 mt-1">{art?.medium || 'Fine Art'}</p>
                  <p className="font-mono text-sm font-bold text-marigold mt-1.5">
                    ₹{art?.price ? art.price.toLocaleString('en-IN') : '0'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-xs md:col-span-5 space-y-1">
                <p className="font-bold text-white uppercase tracking-wider text-[11px] text-white/60">
                  Delivery Destination
                </p>
                <p className="font-semibold text-white">{order.shipping_name || 'Art Collector'}</p>
                <p className="text-white/70">
                  {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code ? `- ${order.shipping_postal_code}` : ''}
                </p>
                <p className="text-white/40 text-[11px] pt-1 border-t border-white/5 mt-1">
                  Insured door-to-door transit via Artelio Logistics
                </p>
              </div>
            </div>

            {/* Delivery Lifecycle Stepper */}
            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">
                Curatorial Logistics Progress
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs relative">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-malachite text-white text-xs font-bold shadow-md">
                    ✓
                  </div>
                  <span className="mt-2 font-semibold text-white">Payment Escrowed</span>
                  <span className="text-[10px] text-white/50">Funds Protected</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md ${
                      isShipped || isDelivered
                        ? 'bg-malachite text-white'
                        : 'bg-brand text-white animate-pulse'
                    }`}
                  >
                    {isShipped || isDelivered ? '✓' : '2'}
                  </div>
                  <span className="mt-2 font-semibold text-white">
                    {isPaid ? 'Atelier Packaging' : 'Dispatched'}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {order.courier_name || 'Insured Courier'}
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-md ${
                      isDelivered ? 'bg-malachite text-white' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isDelivered ? '✓' : '3'}
                  </div>
                  <span className="mt-2 font-semibold text-white">Delivered</span>
                  <span className="text-[10px] text-white/50">48h Unboxing Guarantee</span>
                </div>
              </div>

              {/* Courier Tracking Details */}
              {isShipped && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/10 p-4 text-xs">
                  <div>
                    <span className="text-white/60">Courier Partner: </span>
                    <strong className="text-white">{order.courier_name || 'Insured Partner'}</strong>
                    {order.tracking_note && (
                      <div className="mt-1">
                        <span className="text-white/60">AWB / Tracking Number: </span>
                        <span className="font-mono font-bold text-marigold">{order.tracking_note}</span>
                      </div>
                    )}
                  </div>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-dark transition-colors"
                    >
                      Track Live with Courier ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Certificate of Authenticity & Concierge */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() =>
                  setCoaData({
                    orderId: order.id,
                    orderDate: order.created_at,
                    artworkTitle: art?.title || 'Fine Art',
                    artistName: art?.artistName || 'Artelio Studio Creator',
                    medium: art?.medium,
                    isDigital: art?.isDigital,
                    collectorName: order.shipping_name,
                    imageUrl: art?.imageUrl,
                  })
                }
                className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-all shadow-sm"
              >
                <span>📜</span> Certificate (COA)
              </button>

              <button
                onClick={() =>
                  setInvoiceData({
                    orderId: order.id,
                    orderDate: order.created_at,
                    artworkTitle: art?.title || 'Fine Art',
                    artistName: art?.artistName || 'Artelio Studio Creator',
                    price: art?.price || 0,
                    medium: art?.medium,
                    isDigital: art?.isDigital,
                    buyerName: order.shipping_name,
                    buyerAddress: order.shipping_city,
                    buyerCity: order.shipping_city,
                    buyerState: order.shipping_state,
                    buyerPostalCode: order.shipping_postal_code,
                  })
                }
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all shadow-sm"
              >
                <span>🧾</span> Tax Invoice & Receipt
              </button>

              <div className="flex items-center gap-3">
                <Link
                  href="/contact"
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Need Concierge Assistance? →
                </Link>
                <Link
                  href="/orders"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  All My Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal data={coaData} onClose={() => setCoaData(null)} />

      {/* Invoice Modal */}
      <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-5 py-24 text-center text-white/60">Loading tracking portal…</main>}>
      <TrackContent />
    </Suspense>
  );
}
