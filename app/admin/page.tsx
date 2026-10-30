'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [adminPasskey, setAdminPasskey] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Data
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'artists' | 'artworks' | 'commission'>('orders');

  // Settlement Modal / State
  const [settlingOrder, setSettlingOrder] = useState<any | null>(null);
  const [utrRef, setUtrRef] = useState('');
  const [settlingLoading, setSettlingLoading] = useState(false);

  // Permanent Platform Admin UPI configuration
  const [adminUpi, setAdminUpi] = useState('bhosalegurudatta@oksbi');
  const [adminUpiSaved, setAdminUpiSaved] = useState(false);

  const loadAdminData = useCallback(async (keyOverride?: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const keyToUse = keyOverride || adminPasskey || localStorage.getItem('artelio_admin_key') || 'artelio-admin-2026';

      const headers: Record<string, string> = {
        'x-admin-key': keyToUse,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin', { headers });
      const data = await res.json();

      if (!res.ok) {
        setAuthorized(false);
        setErrorMsg(data.error || 'Admin access authorization failed.');
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setStats(data.stats);
      setOrders(data.orders || []);
      setArtists(data.artists || []);
      setCustomers(data.customers || []);
      localStorage.setItem('artelio_admin_key', keyToUse);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setErrorMsg('Failed to connect to Admin service.');
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [adminPasskey]);

  useEffect(() => {
    // Attempt auto-login if saved key or owner session
    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('artelio_admin_key') : null;
    loadAdminData(savedKey || undefined);

    const savedUpi = typeof window !== 'undefined' ? localStorage.getItem('artelio_platform_upi') : null;
    if (savedUpi) setAdminUpi(savedUpi);
  }, [loadAdminData]);

  async function handlePasskeyLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadAdminData(adminPasskey);
  }

  async function handleSettlePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!settlingOrder) return;
    setSettlingLoading(true);
    setErrorMsg('');

    try {
      const payout = Array.isArray(settlingOrder.payouts) ? settlingOrder.payouts[0] : settlingOrder.payouts;
      const keyToUse = adminPasskey || localStorage.getItem('artelio_admin_key') || 'artelio-admin-2026';

      const res = await fetch('/api/admin/settle-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': keyToUse,
        },
        body: JSON.stringify({
          payoutId: payout?.id,
          orderId: settlingOrder.id,
          transferReference: utrRef.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to record settlement.');

      setSuccessMsg(`Payout for Order #${settlingOrder.id.slice(0, 8).toUpperCase()} marked as transferred!`);
      setSettlingOrder(null);
      setUtrRef('');
      await loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSettlingLoading(false);
    }
  }

  function handleSaveAdminUpi(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('artelio_platform_upi', adminUpi.trim());
    setAdminUpiSaved(true);
    setTimeout(() => setAdminUpiSaved(false), 3000);
  }

  // Generate UPI deep-link for mobile/desktop instant app transfer
  const getUpiTransferUrl = (artistUpi: string, artistName: string, amount: number, orderId: string) => {
    const cleanUpi = artistUpi.trim();
    const encodedName = encodeURIComponent(artistName || 'Artelio Artist');
    const note = encodeURIComponent(`Artelio Payout for Order ${orderId.slice(0, 8).toUpperCase()}`);
    return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${amount}&cu=INR&tn=${note}`;
  };

  // If Not Authorized: Show Admin Unlock Window
  if (!authorized && !loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 py-24 text-center">
        <div className="w-full rounded-3xl border border-amber-500/30 bg-[#121826] p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 text-2xl font-serif font-black shadow-lg shadow-amber-500/20">
            👑
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Artelio Owner & Admin Portal</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Authorized administrator access for live commission oversight, artist payouts, and marketplace analytics.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePasskeyLogin} className="mt-6 space-y-4 text-left">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Admin Passkey / Master Secret
              </span>
              <input
                type="password"
                required
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                placeholder="Enter master admin passkey"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              Unlock Admin Window →
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-500">
            Default master passkey: <code className="text-amber-400">artelio-admin-2026</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Top Banner */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
              <span>👑</span>
              <span>Platform Owner & Commission Command Center</span>
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
              Admin Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time tracking of artwork sales, 10% platform commission, registered artists, and direct UPI settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAdminData()}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition"
          >
            <span>🔄</span>
            <span>Refresh Stats</span>
          </button>

          <Link
            href="/dashboard/upload"
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition"
          >
            + Upload Art
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300 flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 4 Financial & Commission Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total GMV */}
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales (GMV)</span>
            <span className="rounded-full bg-blue-500/20 p-2 text-blue-400 text-sm">💳</span>
          </div>
          <p className="mt-3 font-serif text-3xl font-extrabold text-white">
            ₹{stats?.totalGMV?.toLocaleString('en-IN') || 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total customer money paid via Razorpay</p>
        </div>

        {/* Platform Commission (10%) */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-[#121826] p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Your Commission (10%)</span>
            <span className="rounded-full bg-amber-500/20 p-2 text-amber-400 text-sm">💰</span>
          </div>
          <p className="mt-3 font-serif text-3xl font-extrabold text-amber-300">
            ₹{stats?.totalCommission?.toLocaleString('en-IN') || 0}
          </p>
          <p className="mt-1 text-[11px] text-amber-400/80 font-medium">Permanently retained in your account</p>
        </div>

        {/* Artist Net Share (90%) */}
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artist Share (90%)</span>
            <span className="rounded-full bg-purple-500/20 p-2 text-purple-400 text-sm">🎨</span>
          </div>
          <p className="mt-3 font-serif text-3xl font-extrabold text-purple-300">
            ₹{stats?.totalArtistPayouts?.toLocaleString('en-IN') || 0}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total allocated to artists upon delivery</p>
        </div>

        {/* Inventory Sold Out Status */}
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artwork Status</span>
            <span className="rounded-full bg-emerald-500/20 p-2 text-emerald-400 text-sm">🖼️</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-extrabold text-emerald-400">{stats?.totalSold || 0}</span>
            <span className="text-xs text-slate-400 font-semibold uppercase">Sold Out</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-white font-semibold">{stats?.totalActive || 0} Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total Uploaded: {stats?.totalArtworks || 0} pieces</p>
        </div>
      </div>

      {/* Synchronization Architecture Flow Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-[#0F1420] p-6 shadow-2xl mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
          <span>⚡</span>
          <span>Automatic Revenue Split & UPI Sync Pipeline</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="font-bold text-white block mb-1">1. Customer Payment (100%)</span>
            <p className="text-slate-300 leading-relaxed">
              When a buyer purchases an artwork on Artelio, 100% of the funds immediately land in <strong>your live Razorpay account</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <span className="font-bold text-amber-300 block mb-1">2. Commission Retained (10%)</span>
            <p className="text-slate-300 leading-relaxed">
              Your 10% marketplace fee remains permanently in your bank account as gross platform profit with zero chargebacks.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <span className="font-bold text-emerald-400 block mb-1">3. Direct Artist Settlement (90%)</span>
            <p className="text-slate-300 leading-relaxed">
              Once delivery is confirmed, release the remaining 90% directly to the artist's verified UPI ID with a single click below.
            </p>
          </div>
        </div>

        {/* Permanent Admin UPI Configuration Form */}
        <form onSubmit={handleSaveAdminUpi} className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">
            Platform Commission Recipient UPI ID:
          </span>
          <input
            type="text"
            required
            value={adminUpi}
            onChange={(e) => setAdminUpi(e.target.value)}
            className="rounded-lg border border-white/20 bg-slate-900 px-3 py-1.5 text-xs text-amber-400 font-mono focus:border-amber-500 focus:outline-none"
            placeholder="e.g. yourname@oksbi"
          />
          <button
            type="submit"
            className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            {adminUpiSaved ? '✓ Saved' : 'Save Admin UPI'}
          </button>
          <span className="text-[11px] text-slate-500">
            (All customer checkout funds settle here)
          </span>
        </form>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>📦</span>
          <span>Orders & Artist Payouts ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'artists'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🎨</span>
          <span>Registered Artists & UPI Directory ({artists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('artworks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'artworks'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🖼️</span>
          <span>Inventory: Sold vs Active ({stats?.totalArtworks || 0})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ORDERS & DIRECT ARTIST UPI SETTLEMENTS                   */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">📦</span>
              No customer orders placed yet. As soon as a piece is purchased, it will appear here with instant UPI payout controls.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121826] shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Order / Date</th>
                    <th className="px-4 py-3">Artwork</th>
                    <th className="px-4 py-3">Buyer & Destination</th>
                    <th className="px-4 py-3">Artist & UPI Details</th>
                    <th className="px-4 py-3">Gross (100%)</th>
                    <th className="px-4 py-3 text-amber-400">Your Cut (10%)</th>
                    <th className="px-4 py-3 text-purple-300">Artist Share (90%)</th>
                    <th className="px-4 py-3">Payout Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((o: any) => {
                    const art = o.artworks;
                    const payout = Array.isArray(o.payouts) ? o.payouts[0] : o.payouts;
                    const price = Number(art?.price || 0);
                    const commission = payout?.commission_amount ? Number(payout.commission_amount) : price * 0.10;
                    const artistShare = payout?.payout_amount ? Number(payout.payout_amount) : price * 0.90;

                    const matchingArtist = artists.find((a) => a.id === art?.artist_id);
                    const artistUpi = matchingArtist?.payout_upi_id;

                    const isSettled = payout?.status === 'released' || payout?.transferred_at;

                    return (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-white block">#{o.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {art?.image_url && (
                              <img src={art.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                            )}
                            <span className="font-medium text-white max-w-[120px] truncate block">{art?.title}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-white block font-medium">{o.shipping_name || 'Collector'}</span>
                          <span className="text-[10px] text-slate-400">{o.shipping_city}, {o.shipping_state}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-white block font-medium">{matchingArtist?.name || 'Artist'}</span>
                          {artistUpi ? (
                            <span className="font-mono text-[11px] text-amber-400 font-bold block">
                              ⚡ {artistUpi}
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400 block">⚠ No UPI on file</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                          ₹{price.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3 font-bold text-amber-400 whitespace-nowrap">
                          +₹{commission.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3 font-bold text-purple-300 whitespace-nowrap">
                          ₹{artistShare.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isSettled ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                              ✓ Transferred
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {artistUpi && (
                                <a
                                  href={getUpiTransferUrl(artistUpi, matchingArtist?.name, artistShare, o.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow transition"
                                >
                                  ⚡ Pay via UPI
                                </a>
                              )}
                              <button
                                onClick={() => setSettlingOrder(o)}
                                className="rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                              >
                                Mark Settled
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: REGISTERED ARTISTS & UPI DIRECTORY                       */}
      {/* ============================================================== */}
      {activeTab === 'artists' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121826] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Artist Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Joined On</th>
                  <th className="px-4 py-3 text-amber-400">Linked UPI ID (Payout Destination)</th>
                  <th className="px-4 py-3">Account Holder</th>
                  <th className="px-4 py-3">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {artists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-serif text-xs">
                        {artist.name ? artist.name[0].toUpperCase() : 'A'}
                      </span>
                      <span>{artist.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{artist.email}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(artist.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {artist.payout_upi_id ? (
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {artist.payout_upi_id}
                        </span>
                      ) : (
                        <span className="text-red-400 text-[11px]">⚠ Not configured yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{artist.payout_account_holder || artist.name}</td>
                    <td className="px-4 py-3">
                      {artist.payout_upi_id ? (
                        <span className="text-emerald-400 font-bold">✓ Ready for Payouts</span>
                      ) : (
                        <span className="text-amber-400">Pending Setup</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: INVENTORY: SOLD VS ACTIVE                                */}
      {/* ============================================================== */}
      {activeTab === 'artworks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 text-center">
            <span className="text-3xl block mb-2">🎨</span>
            <span className="font-serif text-4xl font-extrabold text-white block">
              {stats?.totalArtworks || 0}
            </span>
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Total Artworks Uploaded
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <span className="text-3xl block mb-2">🎉</span>
            <span className="font-serif text-4xl font-extrabold text-emerald-400 block">
              {stats?.totalSold || 0}
            </span>
            <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
              Sold Out / Acquired by Collectors
            </span>
          </div>

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
            <span className="text-3xl block mb-2">🖼️</span>
            <span className="font-serif text-4xl font-extrabold text-blue-400 block">
              {stats?.totalActive || 0}
            </span>
            <span className="text-xs uppercase font-bold text-blue-300 tracking-wider">
              Currently Active in Gallery
            </span>
          </div>
        </div>
      )}

      {/* Settlement UTR Modal */}
      {settlingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121826] p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-white">Record Artist UPI Settlement</h3>
            <p className="mt-1 text-xs text-slate-400">
              Order #{settlingOrder.id.slice(0, 8).toUpperCase()} • Amount: ₹
              {(Array.isArray(settlingOrder.payouts) ? settlingOrder.payouts[0] : settlingOrder.payouts)?.payout_amount || 0}
            </p>

            <form onSubmit={handleSettlePayout} className="mt-5 space-y-4">
              <label className="block text-left">
                <span className="text-xs text-slate-300 font-semibold">UPI UTR / Bank Reference Number</span>
                <input
                  type="text"
                  required
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  placeholder="e.g. 430291048291"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlingOrder(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settlingLoading}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow"
                >
                  {settlingLoading ? 'Saving…' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
