'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { inputClass } from '@/lib/ui';

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  artworks: { title: string; price: number; image_url: string | null; is_digital: boolean; artist_id: string } | null;
};

export default function Orders() {
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

  async function loadOrders(uid: string) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, created_at, artworks(title, price, image_url, is_digital, artist_id)')
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
    if (!window.confirm('Confirm you have received this work? The artist will be paid once you confirm.')) return;
    setMessage('');
    const r = await authed(`/api/orders/${orderId}/confirm`);
    if (!r.ok) return setMessage(r.body.error ?? 'Could not confirm.');
    if (userId) await loadOrders(userId);
    setMessage('Thank you. The artist has been released payment.');
  }

  async function submitDispute(orderId: string) {
    setMessage('');
    const r = await authed(`/api/orders/${orderId}/dispute`, { reason });
    if (!r.ok) return setMessage(r.body.error ?? 'Could not send your report.');
    setDisputing(null);
    setReason('');
    if (userId) await loadOrders(userId);
    setMessage('Thanks. We have paused the payment and will look into it.');
  }

  async function submitReview(order: OrderRow) {
    if (!userId || !order.artworks) return;
    const { error } = await supabase.from('reviews').insert({
      order_id: order.id, artist_id: order.artworks.artist_id, reviewer_id: userId, rating, comment: comment.trim() || null,
    });
    if (error) return setMessage(error.message);
    setReviews((r) => ({ ...r, [order.id]: rating }));
    setReviewing(null);
    setComment('');
    setRating(5);
  }

  if (loading) return <main className="mx-auto max-w-3xl px-5 py-16 text-ink/60">Loading your orders…</main>;
  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-2xl font-bold text-ink">Your orders</h1>
        <p className="mt-4 text-ink/70">Please <Link href="/login" className="font-semibold text-brand hover:underline">log in</Link> to see your orders.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-bold text-ink md:text-3xl">Your orders</h1>
      <p className="mt-2 text-sm text-ink/60">Your payment is held safely until you confirm you have received the work.</p>
      {message && <p className="mt-4 text-sm text-brand-dark">{message}</p>}

      {orders.length === 0 ? (
        <p className="mt-6 text-ink/60">No orders yet. <Link href="/browse" className="font-semibold text-brand hover:underline">Browse artworks</Link></p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const art = order.artworks;
            const open = ['paid', 'shipped'].includes(order.status);
            const delivered = order.status === 'delivered';
            const reviewed = reviews[order.id];
            return (
              <div key={order.id} className="rounded-xl border border-ink/10 bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-14 shrink-0 rounded-lg bg-paper bg-cover bg-center" style={art?.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{art?.title ?? 'Untitled'}</p>
                    <p className="text-sm text-ink/60">₹{art?.price.toLocaleString('en-IN')} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold capitalize text-brand-dark">{order.status}</span>
                </div>

                {(open || delivered) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
                    {art?.is_digital && (
                      <button onClick={() => handleDownload(order.id)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                        Download original
                      </button>
                    )}
                    {open && (
                      <button onClick={() => confirmReceipt(order.id)} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-indigo">
                        I received it
                      </button>
                    )}
                    {open && (
                      <button onClick={() => setDisputing(order.id)} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-clay hover:text-clay">
                        Report a problem
                      </button>
                    )}
                    {delivered && !reviewed && reviewing !== order.id && (
                      <button onClick={() => setReviewing(order.id)} className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
                        Rate this artist
                      </button>
                    )}
                    {reviewed && (
                      <span className="text-sm text-ink/70">
                        Your rating: <span className="text-marigold">{'★'.repeat(reviewed)}</span><span className="text-ink/20">{'★'.repeat(5 - reviewed)}</span>
                      </span>
                    )}
                  </div>
                )}

                {disputing === order.id && (
                  <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                    <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What is wrong with the work or the delivery?" className={`${inputClass} resize-none`} />
                    <div className="flex gap-3">
                      <button onClick={() => submitDispute(order.id)} className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white">Send report</button>
                      <button onClick={() => setDisputing(null)} className="text-sm text-ink/60 hover:text-ink">Cancel</button>
                    </div>
                  </div>
                )}

                {reviewing === order.id && (
                  <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'text-marigold' : 'text-ink/20'}`}>★</button>
                      ))}
                    </div>
                    <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the artwork and the experience? (optional)" className={`${inputClass} resize-none`} />
                    <div className="flex gap-3">
                      <button onClick={() => submitReview(order)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Submit review</button>
                      <button onClick={() => setReviewing(null)} className="text-sm text-ink/60 hover:text-ink">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
