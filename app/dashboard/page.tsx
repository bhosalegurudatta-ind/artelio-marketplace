'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { TRIAL_DAYS, hasListingAccess } from '@/lib/mvp';
import ArtCritiqueModal from '@/components/ArtCritiqueModal';
import AIArtStudioModal from '@/components/AIArtStudioModal';
import UpgradeModal from '@/components/UpgradeModal';

type Artwork = { id: string; title: string; price: number; image_url: string | null; sold: boolean; is_digital: boolean; is_ai_assisted: boolean };
type Order = {
  id: string; status: string; created_at: string; release_at: string | null; tracking_note: string | null;
  dispute_reason: string | null; artworks: { title: string; price: number; is_digital: boolean } | null;
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [studioModalOpen, setStudioModalOpen] = useState(false);
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
      .from('users').select('approved, trial_ends_at, paid_until').eq('id', userData.user.id).single();
    if (profile) setAccess({ approved: profile.approved, trialEnds: profile.trial_ends_at, paidUntil: profile.paid_until });

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
        <div className="mb-8 rounded-xl border border-green-500/30 bg-green-50 p-4 text-sm text-green-800 flex items-center justify-between">
          <span>👑 <strong>Creator Pro Active:</strong> Your studio has full AI tool suite and zero platform surcharge until {new Date(access.paidUntil).toLocaleDateString()}.</span>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-full border border-green-700/30 bg-white px-4 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            Extend Plan
          </button>
        </div>
      )}
      {message && <p className="mb-6 text-sm text-brand-dark">{message}</p>}

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Listed works" value={artworks.length.toString()} />
        <Stat label="Awaiting shipment" value={toShip.length.toString()} />
        <Stat label="Earnings released" value={money(released)} />
        <Stat label="Held until delivery" value={money(held)} />
      </div>

      <h2 className="mb-4 text-xl font-bold text-ink">Needs your attention</h2>
      {toShip.length === 0 && pending.length === 0 ? (
        <p className="mb-10 text-ink/60">Nothing needs action right now.</p>
      ) : (
        <div className="mb-10 space-y-3">
          {toShip.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-4">
              <div>
                <p className="font-semibold text-ink">{o.artworks?.title}</p>
                <p className="text-sm text-ink/60">Ship this physical work to the buyer, then mark it shipped.</p>
              </div>
              <button onClick={() => markShipped(o)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                Mark as shipped
              </button>
            </div>
          ))}
          {pending.map((o) => (
            <div key={o.id} className="rounded-xl border border-ink/10 bg-white p-4">
              <p className="font-semibold text-ink">{o.artworks?.title}</p>
              <p className="text-sm text-ink/60">
                {o.status === 'disputed'
                  ? `The buyer raised a problem: "${o.dispute_reason ?? ''}". The payout stays held while we review it.`
                  : o.status === 'shipped'
                  ? `Shipped${o.tracking_note ? ` (${o.tracking_note})` : ''}. Waiting for the buyer to confirm receipt.`
                  : 'Digital download available. Payout releases after the holding period.'}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-5 text-xl font-bold text-ink">Your listings</h2>
      {artworks.length === 0 ? (
        <p className="text-ink/60">Nothing listed yet. <Link href="/dashboard/upload" className="font-semibold text-brand hover:underline">Upload your first piece</Link>.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {artworks.map((art) => (
            <div key={art.id} className="rounded-xl border border-ink/10 bg-white p-3">
              <Link href={`/artwork/${art.id}`}>
                <div className="relative aspect-[4/5] rounded-lg bg-paper bg-cover bg-center" style={art.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}>
                  {art.sold && !art.is_digital && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-1 text-[11px] font-semibold text-white">Sold</span>}
                  <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">
                    {art.is_ai_assisted ? 'AI-assisted' : 'Original'}
                  </span>
                </div>
              </Link>
              <p className="mt-3 truncate text-sm font-semibold text-ink">{art.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-ink/60">{money(art.price)}</p>
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
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <p className="text-xl font-bold text-ink md:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-ink/60">{label}</p>
    </div>
  );
}
