'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass } from '@/lib/ui';
import CertificateModal from '@/components/CertificateModal';
import InvoiceModal from '@/components/InvoiceModal';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  courier_name?: string | null;
  tracking_note?: string | null;
  tracking_url?: string | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  dispute_reason?: string | null;
  artworks: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
    is_digital: boolean;
    artist_id: string;
    medium?: string | null;
  } | null;
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const isNewOrder = searchParams.get('new_order') === '1';

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [reviews, setReviews] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [disputing, setDisputing] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('Artwork arrived damaged');
  const [coaData, setCoaData] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  async function loadOrders(uid: string) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, created_at, shipped_at, delivered_at, courier_name, tracking_note, tracking_url, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code, dispute_reason, artworks(id, title, price, image_url, is_digital, artist_id, medium)')
      .eq('customer_id', uid)
      .order('created_at', { ascending: false });
    setOrders((data as any) ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return setLoading(false);
      setUserId(userData.user.id);
      await loadOrders(userData.user.id);
      const { data: mine } = await supabase.from('reviews').select('order_id, rating').eq('reviewer_id', userData.user.id);
      const map: Record<string, number> = {};
      (mine ?? []).forEach((r: any) => (map[r.order_id] = r.rating));
      setReviews(map);
      setLoading(false);
    }
    load();
  }, []);

  async function authed(path: string, body?: unknown) {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, body: await res.json() };
  }

  async function handleDownload(orderId: string) {
    setMessage('');
    const r = await authed(`/api/download/${orderId}`);
    if (!r.ok) return setMessage(r.body.error ?? 'Could not prepare your download.');
    window.location.href = r.body.url;
  }

  async function confirmReceipt(orderId: string) {
    if (!window.confirm('Confirm you have safely received this artwork? This will release the escrow payment to the artist.')) return;
    setMessage('');
    const r = await authed(`/api/orders/${orderId}/confirm`);
    if (!r.ok) return setMessage(r.body.error ?? 'Could not confirm delivery.');
    if (userId) await loadOrders(userId);
    setMessage('Thank you for confirming receipt. Payment has been released to the artist.');
  }

  async function submitDispute(orderId: string) {
    setMessage('');
    const fullReason = `${disputeCategory}: ${reason.trim()}`;
    const r = await authed(`/api/orders/${orderId}/dispute`, { reason: fullReason });
    if (!r.ok) return setMessage(r.body.error ?? 'Could not send your dispute report.');
    setDisputing(null);
    setReason('');
    if (userId) await loadOrders(userId);
    setMessage('Dispute recorded. Escrow payout is paused, and our support team will contact you shortly.');
  }

  async function submitReview(order: OrderRow) {
    if (!userId || !order.artworks) return;
    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      artist_id: order.artworks.artist_id,
      reviewer_id: userId,
      rating,
      comment: comment.trim() || null,
    });
    if (error) return setMessage(error.message);
    setReviews((r) => ({ ...r, [order.id]: rating }));
    setReviewing(null);
    setComment('');
    setRating(5);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
        <p className="mt-4 text-sm text-ink/60">Loading your collection & orders…</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Collector Orders</h1>
        <p className="mt-3 text-sm text-ink/70">
          Please <Link href="/login" className="font-semibold text-brand hover:underline">sign in</Link> to track your acquisitions and deliveries.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      {isNewOrder && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h2 className="font-semibold text-emerald-800 dark:text-emerald-300">Payment Confirmed!</h2>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400">
                Your order has been placed successfully. Funds are held in secure escrow until you safely receive the artwork.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl">Your Collection Orders</h1>
          <p className="mt-1 text-sm text-ink/60">
            Track dispatches, inspect incoming parcels, or download master digital files.
          </p>
        </div>
        <Link
          href="/browse"
          className="rounded-full border border-ink/15 bg-white/70 px-4 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-white"
        >
          Explore More Art
        </Link>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-brand-dark">
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center">
          <p className="text-base font-semibold text-ink">No acquisitions yet</p>
          <p className="mt-1 text-xs text-ink/60">Discover original fine art and digital masterworks from independent studios.</p>
          <Link
            href="/browse"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-art-glow"
          >
            Browse Gallery
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const art = order.artworks;
            const open = ['paid', 'shipped'].includes(order.status);
            const delivered = order.status === 'delivered';
            const disputed = order.status === 'disputed';
            const reviewed = reviews[order.id];

            return (
              <div key={order.id} className="rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <span className="font-mono text-xs text-ink/50">ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                    <p className="text-xs text-ink/60">
                      Acquired on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        delivered
                          ? 'bg-malachite/15 text-malachite'
                          : disputed
                          ? 'bg-vermilion/15 text-vermilion'
                          : order.status === 'shipped'
                          ? 'bg-brand/15 text-brand'
                          : 'bg-marigold/20 text-marigold'
                      }`}
                    >
                      {order.status === 'paid' ? 'Secured in Escrow' : order.status}
                    </span>
                  </div>
                </div>

                {/* Artwork and Destination Information */}
                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12">
                  <div className="flex gap-4 md:col-span-7">
                    <div
                      className="h-24 w-20 shrink-0 rounded-xl bg-paper bg-cover bg-center border border-ink/10"
                      style={art?.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}
                    />
                    <div>
                      <h2 className="font-serif text-lg font-bold text-ink">{art?.title ?? 'Untitled Masterpiece'}</h2>
                      <p className="text-xs text-ink/60">
                        {art?.medium || (art?.is_digital ? 'Digital Fine Art' : 'Original Artwork')}
                      </p>
                      <p className="mt-2 font-mono text-sm font-bold text-ink">
                        ₹{art?.price ? art.price.toLocaleString('en-IN') : '0'}
                      </p>
                      {art?.is_digital && (
                        <span className="mt-1 inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                          Digital Master Edition
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Tracking / Shipping address */}
                  <div className="rounded-xl bg-ink/5 p-4 text-xs md:col-span-5">
                    {art?.is_digital ? (
                      <div>
                        <p className="font-semibold text-ink">⚡ Instant Digital Release</p>
                        <p className="mt-1 text-ink/70">
                          Access and store your lossless full-resolution artwork file directly to your private devices.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-ink">📍 Shipping Destination:</p>
                        <p className="mt-1 font-medium text-ink">{order.shipping_name || 'Art Collector'}</p>
                        <p className="text-ink/70">
                          {order.shipping_address
                            ? `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_postal_code}`
                            : 'Address provided during checkout'}
                        </p>
                        {order.shipping_phone && (
                          <p className="mt-1 text-ink/60">Courier Phone: {order.shipping_phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Physical Delivery Progress Stepper (for physical artworks) */}
                {!art?.is_digital && (
                  <div className="mt-6 rounded-xl border border-ink/10 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Delivery Lifecycle</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-malachite text-white text-xs font-bold">
                          ✓
                        </div>
                        <span className="mt-1.5 font-semibold text-ink">Order Paid</span>
                        <span className="text-[10px] text-ink/50">Escrow Held</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            ['shipped', 'delivered'].includes(order.status)
                              ? 'bg-malachite text-white'
                              : 'bg-brand text-white animate-pulse'
                          }`}
                        >
                          {['shipped', 'delivered'].includes(order.status) ? '✓' : '2'}
                        </div>
                        <span className="mt-1.5 font-semibold text-ink">
                          {order.status === 'paid' ? 'Studio Packing' : 'Dispatched'}
                        </span>
                        <span className="text-[10px] text-ink/50">
                          {order.courier_name || 'Insured Courier'}
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            delivered
                              ? 'bg-malachite text-white'
                              : 'bg-ink/10 text-ink/40'
                          }`}
                        >
                          {delivered ? '✓' : '3'}
                        </div>
                        <span className="mt-1.5 font-semibold text-ink">Delivered</span>
                        <span className="text-[10px] text-ink/50">48h Inspection</span>
                      </div>
                    </div>

                    {/* Tracking details callout if shipped */}
                    {order.status === 'shipped' && order.tracking_note && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs">
                        <div>
                          <span className="font-semibold text-brand-dark">Tracking / AWB: </span>
                          <span className="font-mono font-bold text-ink">{order.tracking_note}</span>
                          <span className="text-ink/60"> ({order.courier_name || 'Courier Partner'})</span>
                        </div>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-brand hover:underline"
                          >
                            Live Tracking ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Dispute Alert Box */}
                {disputed && (
                  <div className="mt-4 rounded-xl border border-vermilion/30 bg-vermilion/10 p-3.5 text-xs text-vermilion">
                    <p className="font-bold">⚠️ Collector Dispute Under Investigation</p>
                    <p className="mt-0.5 text-vermilion/90">Reason logged: {order.dispute_reason}</p>
                    <p className="mt-1 text-[11px] text-ink/60">
                      Payment is frozen in escrow. Artelio Concierge will reach out via email within 24 hours.
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {art?.is_digital && (
                      <button
                        onClick={() => handleDownload(order.id)}
                        className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-4 py-2 text-xs font-bold text-white shadow hover:shadow-art-glow transition-all"
                      >
                        ⚡ Download Master File
                      </button>
                    )}

                    {open && !disputed && (
                      <button
                        onClick={() => confirmReceipt(order.id)}
                        className="rounded-full bg-malachite px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
                      >
                        ✓ Confirm Safe Arrival
                      </button>
                    )}

                    {open && !disputed && (
                      <button
                        onClick={() => setDisputing(order.id)}
                        className="rounded-full border border-ink/20 px-3.5 py-2 text-xs font-semibold text-ink/80 hover:border-vermilion hover:text-vermilion transition"
                      >
                        Report a Problem
                      </button>
                    )}

                    {delivered && !reviewed && reviewing !== order.id && (
                      <button
                        onClick={() => setReviewing(order.id)}
                        className="rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-xs font-semibold text-brand hover:bg-brand/10 transition"
                      >
                        ★ Review Artwork & Artist
                      </button>
                    )}
                  </div>

                  {reviewed && (
                    <div className="text-xs text-ink/70">
                      Collector Review: <span className="text-marigold font-bold">{'★'.repeat(reviewed)}</span>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setCoaData({
                        orderId: order.id,
                        orderDate: order.created_at,
                        artworkTitle: art?.title || 'Fine Art Masterpiece',
                        artistName: 'Artelio Verified Atelier Artist',
                        medium: art?.medium,
                        isDigital: art?.is_digital,
                        collectorName: order.shipping_name,
                        imageUrl: art?.image_url,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-white shadow-sm transition"
                  >
                    <span>📜</span> Certificate of Authenticity
                  </button>

                  <button
                    onClick={() =>
                      setInvoiceData({
                        orderId: order.id,
                        orderDate: order.created_at,
                        artworkTitle: art?.title || 'Fine Art',
                        artistName: 'Artelio Verified Atelier Artist',
                        price: art?.price || 0,
                        medium: art?.medium,
                        isDigital: art?.is_digital,
                        buyerName: order.shipping_name,
                        buyerAddress: order.shipping_address,
                        buyerCity: order.shipping_city,
                        buyerState: order.shipping_state,
                        buyerPostalCode: order.shipping_postal_code,
                        buyerPhone: order.shipping_phone,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-white shadow-sm transition"
                  >
                    <span>🧾</span> Tax Invoice
                  </button>
                </div>

                {/* Dispute Form Modal/Inline */}
                {disputing === order.id && (
                  <div className="mt-4 space-y-3 rounded-xl border border-clay/30 bg-white p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-clay">Report an Issue</h3>
                    <div>
                      <label className="block text-xs font-semibold text-ink/80">Issue Type</label>
                      <select
                        value={disputeCategory}
                        onChange={(e) => setDisputeCategory(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-ink/15 bg-white p-2 text-xs text-ink"
                      >
                        <option value="Artwork arrived damaged">Artwork arrived damaged in transit</option>
                        <option value="Package not received">Package not received / lost</option>
                        <option value="Different from listing">Piece significantly differs from description</option>
                        <option value="Authenticity concern">Authenticity concern</option>
                        <option value="Other issue">Other issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink/80">Details / Description</label>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please describe what happened. Our trust & safety team will assist you."
                        className={`${inputClass} resize-none text-xs`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitDispute(order.id)}
                        className="rounded-full bg-vermilion px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                      >
                        Submit Dispute & Freeze Payout
                      </button>
                      <button
                        onClick={() => setDisputing(null)}
                        className="rounded-full border border-ink/20 px-3.5 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {reviewing === order.id && (
                  <div className="mt-4 space-y-3 rounded-xl border border-brand/20 bg-white p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand">Rate this Artwork & Artist</h3>
                    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          className={`text-2xl transition hover:scale-110 ${n <= rating ? 'text-marigold' : 'text-ink/20'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience: paint quality, framing, packaging, or display harmony..."
                      className={`${inputClass} resize-none text-xs`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitReview(order)}
                        className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark"
                      >
                        Submit Collector Review
                      </button>
                      <button
                        onClick={() => setReviewing(null)}
                        className="rounded-full border border-ink/20 px-3.5 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archival Certificate of Authenticity Modal */}
      <CertificateModal data={coaData} onClose={() => setCoaData(null)} />

      {/* Official Tax Invoice & Acquisition Receipt Modal */}
      <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />
    </main>
  );
}

export default function Orders() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-4xl px-5 py-24 text-center">Loading orders…</main>}>
      <OrdersContent />
    </Suspense>
  );
}
