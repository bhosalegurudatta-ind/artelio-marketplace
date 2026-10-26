'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { TRIAL_DAYS, hasListingAccess } from '@/lib/mvp';
import ArtCritiqueModal from '@/components/ArtCritiqueModal';
import AIArtStudioModal from '@/components/AIArtStudioModal';
import UpgradeModal from '@/components/UpgradeModal';
import PackingSlipModal from '@/components/PackingSlipModal';
import ShipOrderModal from '@/components/ShipOrderModal';
import PayoutSettingsModal from '@/components/PayoutSettingsModal';

type Artwork = { id: string; title: string; price: number; image_url: string | null; sold: boolean; is_digital: boolean; is_ai_assisted: boolean };
type Order = {
  id: string;
  status: string;
  created_at: string;
  shipped_at?: string | null;
  release_at: string | null;
  tracking_note: string | null;
  courier_name?: string | null;
  tracking_url?: string | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  dispute_reason: string | null;
  artworks: { title: string; price: number; is_digital: boolean; medium?: string | null } | null;
  payouts: { payout_amount: number; status: string }[] | { payout_amount: number; status: string } | null;
};

const payoutOf = (o: Order) => (Array.isArray(o.payouts) ? o.payouts[0] : o.payouts);
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [access, setAccess] = useState<{ approved: boolean; trialEnds: string | null; paidUntil: string | null } | null>(null);
  const [message, setMessage] = useState('');
  const [artistName, setArtistName] = useState('');
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [slipOrder, setSlipOrder] = useState<Order | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutConfigured, setPayoutConfigured] = useState<boolean | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<{ method: string; target: string } | null>(null);
  const [critiqueModal, setCritiqueModal] = useState<{
    open: boolean;
    artworkId: string | null;
    title: string | null;
    imageUrl: string | null;
  }>({ open: false, artworkId: null, title: null, imageUrl: null });

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('users')
      .select('name, approved, trial_ends_at, paid_until, payout_method, payout_upi_id, payout_account_number')
      .eq('id', userData.user.id)
      .single();

    if (profile) {
      if (profile.name) setArtistName(profile.name);
      setAccess({ approved: profile.approved, trialEnds: profile.trial_ends_at, paidUntil: profile.paid_until });

      const hasPayout = Boolean(
        (profile.payout_method === 'upi' && profile.payout_upi_id) ||
        (profile.payout_method === 'bank' && profile.payout_account_number)
      );
      setPayoutConfigured(hasPayout);
      if (hasPayout) {
        setPayoutInfo({
          method: profile.payout_method === 'upi' ? 'UPI' : 'Bank',
          target: profile.payout_method === 'upi' ? profile.payout_upi_id : `Bank Acc ending in ${String(profile.payout_account_number).slice(-4)}`
        });
      } else {
        setPayoutInfo(null);
      }
    }

    const { data: artworkRows } = await supabase
      .from('artworks')
      .select('id, title, price, image_url, sold, is_digital, is_ai_assisted')
      .eq('artist_id', userData.user.id)
      .order('created_at', { ascending: false });
    setArtworks(artworkRows ?? []);

    const { data: session } = await supabase.auth.getSession();
    const res = await fetch('/api/artist/orders', { headers: { Authorization: `Bearer ${session.session?.access_token}` } });
    const body = await res.json();
    setOrders(body.orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function authed(path: string, body?: unknown) {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, body: await res.json() };
  }

  async function markShipped(order: Order) {
    const note = window.prompt('Tracking number or courier name (optional):', '') ?? null;
    if (note === null) return;
    setMessage('');
    const r = await authed(`/api/orders/${order.id}/ship`, { trackingNote: note });
    if (!r.ok) return setMessage(r.body.error ?? 'Could not mark as shipped.');
    setMessage('Marked as shipped. The payout releases 10 days after shipping if the buyer raises no problem.');
    load();
  }

  async function handleDelete(art: Artwork) {
    if (!window.confirm(`Remove "${art.title}" from Artelio?`)) return;
    const { error } = await supabase.from('artworks').delete().eq('id', art.id);
    if (error) return setMessage(`"${art.title}" has orders attached, so it can't be removed.`);
    setArtworks((list) => list.filter((a) => a.id !== art.id));
  }

  if (loading) return <main className="mx-auto max-w-5xl px-5 py-16 text-ink/60">Loading your studio…</main>;
  if (!loggedIn) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-ink/70">Please <Link href="/login" className="font-semibold text-brand hover:underline">log in</Link> to see your studio.</p>
      </main>
    );
  }

  // Earnings: money released to you vs money still held until delivery.
  const released = orders.reduce((s, o) => s + (payoutOf(o)?.status === 'released' ? Number(payoutOf(o)!.payout_amount) : 0), 0);
  const held = orders.reduce((s, o) => s + (payoutOf(o)?.status === 'held' || payoutOf(o)?.status === 'disputed' ? Number(payoutOf(o)!.payout_amount) : 0), 0);
  const toShip = orders.filter((o) => o.status === 'paid' && o.artworks && !o.artworks.is_digital);
  const pending = orders.filter((o) => ['shipped', 'paid', 'disputed'].includes(o.status) && !toShip.includes(o));

  const trialEnd = access?.trialEnds ? new Date(access.trialEnds) : null;
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null;
  const isPremium = access ? hasListingAccess({ trial_ends_at: access.trialEnds, paid_until: access.paidUntil }) : false;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">Your studio</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStudioModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-800 transition hover:bg-purple-100 shadow-sm"
          >
            <span className="text-sm">🎨</span> AI Artwork Studio
          </button>
          <button
            onClick={() => setCritiqueModal({ open: true, artworkId: null, title: null, imageUrl: null })}
            className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10 shadow-sm"
          >
            <span className="text-sm">✦</span> AI Critique Lab
          </button>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-marigold/60 bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-marigold/20 shadow-sm"
          >
            <span>👑</span> Upgrade Plan
          </button>
          <button
            onClick={() => setPayoutModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition shadow-sm ${
              payoutConfigured
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-amber-500/60 bg-amber-500/20 text-amber-200 animate-pulse'
            }`}
          >
            <span>💳</span> {payoutConfigured ? 'Payout Settings' : 'Setup Payouts'}
          </button>
          <Link href="/dashboard/upload" className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-art-glow hover:scale-105 transition-all">
            + Upload New Piece
          </Link>
        </div>
      </div>

      {access && !access.approved && (
        <div className="mb-8 rounded-xl border border-marigold/50 bg-marigold/10 p-4 text-sm text-ink flex items-center justify-between">
          <span>Your artist application is waiting for approval. You can upgrade to activate instant listing access.</span>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Activate Instant Access
          </button>
        </div>
      )}
      {access?.approved && trialDaysLeft !== null && trialDaysLeft > 0 && !access.paidUntil && (
        <div className="mb-8 rounded-xl bg-brand-soft p-4 text-sm text-ink flex items-center justify-between">
          <span>Free trial: {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left of {TRIAL_DAYS}. Artelio charges no subscription during the trial.</span>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
      {access?.paidUntil && (
        <div className="mb-8 rounded-xl border border-green-500/30 bg-green-950/40 p-4 text-sm text-green-200 flex items-center justify-between">
          <span>👑 <strong>Creator Pro Active:</strong> Your studio has full AI tool suite and zero platform surcharge until {new Date(access.paidUntil).toLocaleDateString()}.</span>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-full border border-green-500/40 bg-[#121826] px-4 py-1.5 text-xs font-semibold text-green-300 hover:bg-[#161F30]"
          >
            Extend Plan
          </button>
        </div>
      )}
      {access?.approved && payoutConfigured === false && (
        <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-200 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="font-bold text-amber-300 flex items-center gap-2">
              <span>⚠️</span> Action Required: Set Up Payout Destination
            </h3>
            <p className="mt-1 text-xs text-amber-200/80 leading-relaxed">
              You haven&apos;t configured where Artelio should send your sales earnings yet. Connect your UPI ID (GPay, PhonePe, Paytm) or Bank Account so your 90% artist proceeds can be deposited.
            </p>
          </div>
          <button
            onClick={() => setPayoutModalOpen(true)}
            className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all"
          >
            Configure Payouts
          </button>
        </div>
      )}

      {message && <p className="mb-6 text-sm text-brand-dark">{message}</p>}

      <div className="mb-1">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Listed works" value={artworks.length.toString()} />
          <Stat label="Awaiting shipment" value={toShip.length.toString()} />
          <Stat label="Earnings released" value={money(released)} />
          <Stat label="Held until delivery" value={money(held)} />
        </div>
        <div className="mt-2 mb-10 flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-[#121826] px-5 py-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span>Settlement Channel:</span>
            {payoutInfo ? (
              <span className="font-semibold text-emerald-400">
                ✓ {payoutInfo.method} ({payoutInfo.target})
              </span>
            ) : (
              <span className="font-semibold text-amber-400">
                ⚠️ Not configured
              </span>
            )}
          </div>
          <button
            onClick={() => setPayoutModalOpen(true)}
            className="font-medium text-brand hover:underline"
          >
            {payoutInfo ? 'Update Account Details →' : 'Set Up Payout Destination →'}
          </button>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-white">Needs your attention</h2>
      {toShip.length === 0 && pending.length === 0 ? (
        <p className="mb-10 text-white/60">Nothing needs action right now.</p>
      ) : (
        <div className="mb-10 space-y-4">
          {toShip.map((o) => (
            <div key={o.id} className="rounded-xl border border-marigold/30 bg-[#121826] p-5 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-marigold/20 px-2 py-0.5 text-xs font-bold text-marigold">
                      ACTION REQUIRED: SHIP ARTWORK
                    </span>
                    <span className="text-xs text-white/50">Order #{o.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-bold text-white">{o.artworks?.title}</h3>
                  <p className="text-xs text-white/60">
                    {o.artworks?.medium || 'Original'} · Paid: {money(o.artworks?.price || 0)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSlipOrder(o)}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    <span>🖨️</span> Print Label & Packing Slip
                  </button>
                  <button
                    onClick={() => setShippingOrder(o)}
                    className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-4 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-art-glow transition-all"
                  >
                    Fulfill & Mark Shipped
                  </button>
                </div>
              </div>

              {/* Shipping Destination details */}
              <div className="mt-4 rounded-lg border border-white/5 bg-white/5 p-4 text-xs">
                <p className="font-semibold text-white/90">📍 Delivery Destination:</p>
                <p className="mt-1 font-medium text-white">{o.shipping_name || 'Collector'}</p>
                <p className="text-white/70">
                  {o.shipping_address
                    ? `${o.shipping_address}, ${o.shipping_city}, ${o.shipping_state} - ${o.shipping_postal_code}`
                    : 'Customer address on profile'}
                </p>
                {o.shipping_phone && (
                  <p className="mt-1 text-white/80">
                    Phone for courier: <span className="font-mono font-semibold text-brand-soft">{o.shipping_phone}</span>
                  </p>
                )}
              </div>
            </div>
          ))}

          {pending.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/10 bg-[#121826] p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{o.artworks?.title}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  o.status === 'disputed' ? 'bg-vermilion/20 text-vermilion' : 'bg-brand/20 text-brand-soft'
                }`}>
                  {o.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/70">
                {o.status === 'disputed' ? (
                  <span className="text-clay">
                    ⚠️ Buyer report: &quot;{o.dispute_reason}&quot;. Artelio support is reviewing this order. Escrow payout is paused.
                  </span>
                ) : o.status === 'shipped' ? (
                  <span>
                    📦 Dispatched via <strong className="text-white">{o.courier_name || 'Courier'}</strong>
                    {o.tracking_note && (
                      <> · AWB / Tracking: <span className="font-mono text-marigold">{o.tracking_note}</span></>
                    )}
                    {o.tracking_url && (
                      <> · <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Track parcel ↗</a></>
                    )}
                  </span>
                ) : (
                  'Digital masterwork delivered. Payout releases after the standard 7-day window.'
                )}
              </p>
              {o.release_at && o.status === 'shipped' && (
                <p className="mt-1 text-[11px] text-white/40">
                  Auto-release date: {new Date(o.release_at).toLocaleDateString('en-IN')} (or upon collector confirmation).
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">Earnings & Settlement Ledger</h2>
              <p className="text-xs text-white/60">Transparent 90% payout accounting on every artwork sale</p>
            </div>
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Payout Settings →
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#121826]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-4 py-3">Artwork / Order</th>
                  <th className="px-4 py-3">Gross Sale</th>
                  <th className="px-4 py-3">Platform Fee (10%)</th>
                  <th className="px-4 py-3">Your Net Share (90%)</th>
                  <th className="px-4 py-3">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {orders.map((o) => {
                  const gross = o.artworks?.price || 0;
                  const net = payoutOf(o)?.payout_amount || Math.round(gross * 0.9);
                  const fee = Math.round(gross * 0.1);
                  const pStatus = payoutOf(o)?.status || 'held';

                  return (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-white">{o.artworks?.title || 'Fine Art'}</p>
                        <p className="font-mono text-[11px] text-white/40">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{money(gross)}</td>
                      <td className="px-4 py-3.5 text-white/60">- {money(fee)}</td>
                      <td className="px-4 py-3.5 font-bold text-marigold">{money(net)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                          pStatus === 'released'
                            ? 'bg-malachite/20 text-malachite'
                            : pStatus === 'disputed'
                            ? 'bg-vermilion/20 text-vermilion'
                            : 'bg-marigold/20 text-marigold'
                        }`}>
                          {pStatus === 'released' ? '✓ Released / Paid' : pStatus === 'disputed' ? '⚠️ Disputed' : '🔒 Held in Escrow'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="mb-5 text-xl font-bold text-white">Your listings</h2>
      {artworks.length === 0 ? (
        <p className="text-white/60">Nothing listed yet. <Link href="/dashboard/upload" className="font-semibold text-brand hover:underline">Upload your first piece</Link>.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {artworks.map((art) => (
            <div key={art.id} className="rounded-xl border border-white/10 bg-[#121826] p-3">
              <Link href={`/artwork/${art.id}`}>
                <div className="relative aspect-[4/5] rounded-lg bg-paper bg-cover bg-center" style={art.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}>
                  {art.sold && !art.is_digital && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-1 text-[11px] font-semibold text-white">Sold</span>}
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 border border-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                    {art.is_ai_assisted ? 'AI-assisted' : 'Original'}
                  </span>
                </div>
              </Link>
              <p className="mt-3 truncate text-sm font-semibold text-white">{art.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-white/60">{money(art.price)}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCritiqueModal({ open: true, artworkId: art.id, title: art.title, imageUrl: art.image_url })}
                    className="text-xs font-semibold text-brand hover:underline"
                    title="Open AI Critique & Palette Lab"
                  >
                    ✦ Critique
                  </button>
                  <button onClick={() => handleDelete(art)} className="text-xs text-clay hover:underline">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ArtCritiqueModal
        isOpen={critiqueModal.open}
        onClose={() => setCritiqueModal({ open: false, artworkId: null, title: null, imageUrl: null })}
        defaultArtworkId={critiqueModal.artworkId}
        defaultTitle={critiqueModal.title}
        defaultImageUrl={critiqueModal.imageUrl}
        isPremium={isPremium}
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        defaultRole="artist"
        onSuccess={() => load()}
      />

      <AIArtStudioModal
        isOpen={studioModalOpen}
        onClose={() => setStudioModalOpen(false)}
        userRole="artist"
      />

      <PackingSlipModal
        order={slipOrder}
        artistName={artistName}
        onClose={() => setSlipOrder(null)}
      />

      <ShipOrderModal
        order={shippingOrder}
        isOpen={Boolean(shippingOrder)}
        onClose={() => setShippingOrder(null)}
        onSuccess={() => {
          setMessage('Order marked as shipped. Courier details shared with buyer.');
          load();
        }}
      />

      <PayoutSettingsModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        onUpdated={() => {
          setMessage('Payout destination updated successfully.');
          load();
        }}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121826] p-5 shadow-sm">
      <p className="text-xl font-bold text-white md:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  );
}
