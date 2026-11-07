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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 text-[#17223B]">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F83758]">Admin Command Center</span>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#17223B] mt-1">
            Payouts &amp; Bank Transfers
          </h1>
          <p className="mt-1 text-sm text-[#626262]">
            Review Razorpay Route automatic transfers, monitor escrow releases, and resolve failed artist payouts.
          </p>
        </div>

        <button
          onClick={loadPayouts}
          className="rounded-xl border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#17223B] hover:bg-[#F3F3F3] shadow-xs transition"
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Admin Navigation Bar */}
      <AdminNav active="payouts" />

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#626262]">Total Payouts</span>
          <p className="font-serif text-2xl font-extrabold text-[#17223B] mt-1">{stats.total ?? 0}</p>
          <span className="text-[11px] text-[#8E8E8E]">Registered orders</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Transferred / Succeeded</span>
          <p className="font-serif text-2xl font-extrabold text-emerald-600 mt-1">{stats.processed ?? 0}</p>
          <span className="text-[11px] text-[#8E8E8E]">Dispatched to bank</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Held in Escrow</span>
          <p className="font-serif text-2xl font-extrabold text-amber-600 mt-1">{stats.held ?? 0}</p>
          <span className="text-[11px] text-[#8E8E8E]">Pending delivery confirmation</span>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${stats.failed > 0 ? 'border-rose-300 bg-rose-50/50' : 'border-[#E8E8E8] bg-white'}`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Failed Transfers</span>
          <p className="font-serif text-2xl font-extrabold text-rose-600 mt-1">{stats.failed ?? 0}</p>
          <span className="text-[11px] text-[#8E8E8E]">Requires review / retry</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
            filter === 'all' ? 'bg-[#F83758] text-white' : 'bg-white border border-[#DEDBDB] text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B]'
          }`}
        >
          All Payouts ({payouts.length})
        </button>

        <button
          onClick={() => setFilter('failed')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
            filter === 'failed' ? 'bg-rose-600 text-white shadow-md' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          🚨 Failed Transfers ({stats.failed ?? 0})
        </button>

        <button
          onClick={() => setFilter('released')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
            filter === 'released' ? 'bg-emerald-600 text-white' : 'bg-white border border-[#DEDBDB] text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B]'
          }`}
        >
          Released ({stats.released ?? 0})
        </button>

        <button
          onClick={() => setFilter('held')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
            filter === 'held' ? 'bg-amber-600 text-white' : 'bg-white border border-[#DEDBDB] text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B]'
          }`}
        >
          Held in Escrow ({stats.held ?? 0})
        </button>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-12 text-center text-[#626262] shadow-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#F83758] border-r-transparent mb-2" />
          <p className="text-xs">Loading payouts ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-12 text-center text-[#626262] shadow-sm">
          <p className="text-sm font-bold text-[#17223B]">No payouts match this filter.</p>
          <p className="text-xs text-[#8E8E8E] mt-1">When artwork orders are confirmed and released, payouts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((payout) => {
            const hasError = payout.transfer_status === 'failed' || Boolean(payout.transfer_error);
            const isProcessed = payout.transfer_status === 'processed' || Boolean(payout.transferred_at);

            return (
              <div
                key={payout.id}
                className={`rounded-2xl border p-5 transition-all shadow-sm ${
                  hasError
                    ? 'border-rose-300 bg-rose-50/40'
                    : 'border-[#E8E8E8] bg-white'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8E8E8] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#8E8E8E]">Order #{payout.order_id?.slice(0, 8)}</span>
                      <span className="text-[#8E8E8E]">•</span>
                      <span className="text-xs text-[#8E8E8E]">
                        {new Date(payout.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#17223B] mt-1">
                      {payout.orders?.artworks?.title || 'Fine Art Original'}
                    </h3>
                    <p className="text-xs text-[#626262]">
                      Sale: ₹{Number(payout.sale_amount).toLocaleString('en-IN')} · Fee: ₹{Number(payout.commission_amount).toLocaleString('en-IN')} (10%)
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Escrow Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        payout.status === 'released'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Escrow: {payout.status}
                    </span>

                    {/* Transfer Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        isProcessed
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : hasError
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
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
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-bold flex items-center gap-1.5 text-rose-800">
                          <span>🚨</span> Transfer Error: {payout.transfer_error || 'Transfer failed via Razorpay Route'}
                        </p>
                        <p className="mt-1 text-[11px] text-rose-700/90">
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
                          className="rounded-lg border border-[#DEDBDB] bg-white hover:bg-[#F3F3F3] text-[#17223B] px-3 py-1.5 text-xs font-semibold transition shadow-xs"
                        >
                          Manual Settle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Artist & Banking Metadata */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FAFAFA] rounded-xl p-3 border border-[#E8E8E8]">
                  <div>
                    <span className="text-[#8E8E8E] block text-[10px] uppercase font-bold">Artist / Studio</span>
                    <span className="font-semibold text-[#17223B] mt-0.5 block">{payout.users?.name || 'Studio Artist'}</span>
                    <span className="text-[#626262] block text-[11px]">{payout.users?.email}</span>
                  </div>

                  <div>
                    <span className="text-[#8E8E8E] block text-[10px] uppercase font-bold">Razorpay Route Account</span>
                    {payout.users?.linked_account_id ? (
                      <span className="font-mono text-emerald-700 font-semibold mt-0.5 block">
                        ✓ {payout.users.linked_account_id}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold mt-0.5 block">
                        ⚠️ No linked account on file
                      </span>
                    )}
                    <span className="text-[#8E8E8E] block text-[11px]">
                      KYC: {payout.users?.kyc_status || 'not_linked'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#8E8E8E] block text-[10px] uppercase font-bold">Transfer Reference</span>
                    <span className="font-mono text-[#17223B] font-semibold mt-0.5 block truncate">
                      {payout.transfer_id || payout.transfer_reference || 'Pending release'}
                    </span>
                    {payout.transferred_at && (
                      <span className="text-[11px] text-[#8E8E8E] block">
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
