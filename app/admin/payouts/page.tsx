'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

type PayoutItem = {
  id: string;
  order_id: string;
  artist_id: string;
  sale_amount: number;
  commission_amount: number;
  payout_amount: number;
  status: 'held' | 'released' | 'disputed' | string;
  created_at: string;
  released_at?: string | null;
  transferred_at?: string | null;
  transfer_reference?: string | null;
  transfer_id?: string | null;
  transfer_status?: 'processed' | 'pending' | 'failed' | 'settled' | string | null;
  transfer_error?: string | null;
  orders?: {
    id: string;
    status: string;
    created_at: string;
    artworks?: {
      id: string;
      title: string;
      price: number;
      medium?: string;
      image_url?: string;
    } | null;
  } | null;
  users?: {
    id: string;
    name: string;
    email: string;
    linked_account_id?: string | null;
    kyc_status?: string | null;
    payout_account_number?: string | null;
    payout_ifsc?: string | null;
    payout_bank_name?: string | null;
  } | null;
};

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, released: 0, held: 0, processed: 0, failed: 0 });
  const [filter, setFilter] = useState<'all' | 'failed' | 'released' | 'held'>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function loadPayouts() {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Authentication required.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/payouts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch payouts.');
      }

      setPayouts(data.payouts || []);
      setStats(data.stats || {});
    } catch (err: any) {
      console.error('Load payouts error:', err);
      setErrorMsg(err.message || 'Could not load payouts ledger.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function handleRetryTransfer(payoutId: string) {
    setRetryingId(payoutId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not logged in');

      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payoutId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Retry transfer failed.');
      }

      setSuccessMsg(`✓ Transfer retry succeeded! Transfer ID: ${data.transferId}`);
      await loadPayouts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not complete transfer retry.');
    } finally {
      setRetryingId(null);
    }
  }

  async function handleManualSettle(payoutId: string, orderId: string) {
    const ref = prompt('Enter manual transaction / bank reference number (e.g. UTR / UPI Ref):');
    if (!ref) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch('/api/admin/settle-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payoutId, orderId, transferReference: ref }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as settled.');

      setSuccessMsg(`✓ Payout marked settled with reference: ${data.reference}`);
      await loadPayouts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark settled.');
    }
  }

  const filtered = payouts.filter((p) => {
    if (filter === 'failed') return p.transfer_status === 'failed' || Boolean(p.transfer_error);
    if (filter === 'released') return p.status === 'released';
    if (filter === 'held') return p.status === 'held';
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 text-white">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F83758]">Admin Command Center</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">
            Payouts &amp; Bank Transfers
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Review Razorpay Route automatic transfers, monitor escrow releases, and resolve failed artist payouts.
          </p>
        </div>

        <button
          onClick={loadPayouts}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Admin Navigation Bar */}
      <AdminNav active="payouts" />

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Total Payouts</span>
          <p className="font-serif text-2xl font-bold text-white mt-1">{stats.total ?? 0}</p>
          <span className="text-[11px] text-white/40">Registered orders</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#121826] p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Transferred / Succeeded</span>
          <p className="font-serif text-2xl font-bold text-emerald-400 mt-1">{stats.processed ?? 0}</p>
          <span className="text-[11px] text-white/40">Dispatched to bank</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#121826] p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Held in Escrow</span>
          <p className="font-serif text-2xl font-bold text-amber-400 mt-1">{stats.held ?? 0}</p>
          <span className="text-[11px] text-white/40">Pending delivery confirmation</span>
        </div>

        <div className={`rounded-2xl border p-4 ${stats.failed > 0 ? 'border-rose-500/50 bg-rose-950/20' : 'border-white/10 bg-[#121826]'}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Failed Transfers</span>
          <p className="font-serif text-2xl font-bold text-rose-400 mt-1">{stats.failed ?? 0}</p>
          <span className="text-[11px] text-white/40">Requires review / retry</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'all' ? 'bg-[#F83758] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          All Payouts ({payouts.length})
        </button>

        <button
          onClick={() => setFilter('failed')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'failed' ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
          }`}
        >
          🚨 Failed Transfers ({stats.failed ?? 0})
        </button>

        <button
          onClick={() => setFilter('released')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'released' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Released ({stats.released ?? 0})
        </button>

        <button
          onClick={() => setFilter('held')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'held' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          Held in Escrow ({stats.held ?? 0})
        </button>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-white/50">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#F83758] border-r-transparent mb-2" />
          <p className="text-xs">Loading payouts ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-white/50">
          <p className="text-sm font-semibold text-white">No payouts match this filter.</p>
          <p className="text-xs text-white/40 mt-1">When artwork orders are confirmed and released, payouts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((payout) => {
            const hasError = payout.transfer_status === 'failed' || Boolean(payout.transfer_error);
            const isProcessed = payout.transfer_status === 'processed' || Boolean(payout.transferred_at);

            return (
              <div
                key={payout.id}
                className={`rounded-2xl border p-5 transition-all ${
                  hasError
                    ? 'border-rose-500/50 bg-[#1c0f17] shadow-lg'
                    : 'border-white/10 bg-[#121826]'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white/50">Order #{payout.order_id?.slice(0, 8)}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/50">
                        {new Date(payout.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-white mt-1">
                      {payout.orders?.artworks?.title || 'Fine Art Original'}
                    </h3>
                    <p className="text-xs text-white/60">
                      Sale: ₹{Number(payout.sale_amount).toLocaleString('en-IN')} · Fee: ₹{Number(payout.commission_amount).toLocaleString('en-IN')} (10%)
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Escrow Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        payout.status === 'released'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      Escrow: {payout.status}
                    </span>

                    {/* Transfer Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        isProcessed
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : hasError
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      Transfer: {payout.transfer_status || (payout.transferred_at ? 'processed' : 'untransferred')}
                    </span>

                    {/* Payout Net Amount */}
                    <span className="font-serif text-base font-extrabold text-[#F83758] ml-2">
                      ₹{Number(payout.payout_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Transfer Failure Alert Banner */}
                {hasError && (
                  <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-bold flex items-center gap-1.5 text-rose-200">
                          <span>🚨</span> Transfer Error: {payout.transfer_error || 'Transfer failed via Razorpay Route'}
                        </p>
                        <p className="mt-1 text-[11px] text-rose-300/80">
                          The payout remains safely marked as released. Verify the artist's linked account and retry the automatic transfer below.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRetryTransfer(payout.id)}
                          disabled={retryingId === payout.id}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-50"
                        >
                          {retryingId === payout.id ? 'Retrying…' : '⚡ Retry Bank Transfer'}
                        </button>
                        <button
                          onClick={() => handleManualSettle(payout.id, payout.order_id)}
                          className="rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 text-xs font-medium transition"
                        >
                          Manual Settle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Artist & Banking Metadata */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/5 rounded-xl p-3 border border-white/5">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Artist / Studio</span>
                    <span className="font-semibold text-white mt-0.5 block">{payout.users?.name || 'Studio Artist'}</span>
                    <span className="text-white/60 block text-[11px]">{payout.users?.email}</span>
                  </div>

                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Razorpay Route Account</span>
                    {payout.users?.linked_account_id ? (
                      <span className="font-mono text-emerald-400 font-semibold mt-0.5 block">
                        ✓ {payout.users.linked_account_id}
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold mt-0.5 block">
                        ⚠️ No linked account on file
                      </span>
                    )}
                    <span className="text-white/40 block text-[11px]">
                      KYC: {payout.users?.kyc_status || 'not_linked'}
                    </span>
                  </div>

                  <div>
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Transfer Reference</span>
                    <span className="font-mono text-white/90 mt-0.5 block truncate">
                      {payout.transfer_id || payout.transfer_reference || 'Pending release'}
                    </span>
                    {payout.transferred_at && (
                      <span className="text-[11px] text-white/40 block">
                        Sent on {new Date(payout.transferred_at).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
