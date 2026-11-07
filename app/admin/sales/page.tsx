'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

interface SaleRecord {
  id: string;
  order_id: string;
  artist_id: string;
  sale_amount: number;
  commission_amount: number;
  payout_amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
  transfer_reference: string | null;
  transferred_at: string | null;
  orders?: {
    id: string;
    artwork_id: string;
    customer_id: string;
    status: string;
    created_at: string;
    razorpay_payment_id?: string;
    shipping_name?: string;
    shipping_phone?: string;
    shipping_address?: string;
    shipping_city?: string;
    shipping_state?: string;
    artworks?: {
      id: string;
      title: string;
      image_url: string;
      medium: string;
      is_digital: boolean;
      sold: boolean;
    };
    users?: {
      id: string;
      name: string;
      email: string;
    };
  };
  artists?: {
    id: string;
    name: string;
    email: string;
    payout_method?: string;
    payout_upi_id?: string;
    payout_account_holder?: string;
    payout_bank_name?: string; // Used for QR code or bank name
  };
}

interface SalesSummary {
  totalAdminEarnings: number;
  totalMarketplaceVolume: number;
  totalArtistPayouts: number;
  totalSoldArtworks: number;
}

export default function AdminSalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'digital' | 'physical' | 'released' | 'held'>('all');
  const [selectedQrModal, setSelectedQrModal] = useState<{ artistName: string; upiId: string; qrUrl: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  async function loadSales() {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Please log in with administrator privileges.');

      const res = await fetch('/api/admin/sales', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch sales ledger.');
      }

      setSummary(data.summary);
      setSales(data.sales || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading sales ledger.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedUpi(id);
    setTimeout(() => setCopiedUpi(null), 2500);
  }

  const filteredSales = sales.filter((item) => {
    const art = item.orders?.artworks;
    const buyer = item.orders?.users;
    const artist = item.artists;

    // Filter check
    if (filterType === 'digital' && !art?.is_digital) return false;
    if (filterType === 'physical' && art?.is_digital) return false;
    if (filterType === 'released' && item.status !== 'released') return false;
    if (filterType === 'held' && item.status !== 'held') return false;

    // Search query check
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (art?.title && art.title.toLowerCase().includes(q)) ||
      (buyer?.name && buyer.name.toLowerCase().includes(q)) ||
      (buyer?.email && buyer.email.toLowerCase().includes(q)) ||
      (artist?.name && artist.name.toLowerCase().includes(q)) ||
      (artist?.payout_upi_id && artist.payout_upi_id.toLowerCase().includes(q)) ||
      (item.order_id && item.order_id.toLowerCase().includes(q))
    );
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F83758]">
            Artelio Financial Ledger
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-[#17223B] mt-1">
            Sold Artworks &amp; Admin Earnings
          </h1>
          <p className="mt-1 text-sm text-[#626262]">
            Real-time track of all artwork sales, 10% platform commission credited to your account, and artist UPI settlement details.
          </p>
        </div>

        <button
          onClick={loadSales}
          disabled={loading}
          className="rounded-xl border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#17223B] hover:bg-[#F3F3F3] shadow-xs transition"
        >
          {loading ? 'Refreshing…' : '🔄 Refresh Ledger'}
        </button>
      </div>

      {/* Admin Nav */}
      <AdminNav active="sales" />

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Summary Financial Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* 1. Admin Total Money Received */}
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Admin Money Received
              </span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="mt-3 font-serif text-3xl md:text-4xl font-black text-emerald-700">
              ₹{summary.totalAdminEarnings.toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-800/80 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>10% Platform Commission Credited</span>
            </div>
          </div>

          {/* 2. Total Marketplace Sales GMV */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">
                Total Customer GMV
              </span>
              <span className="text-2xl">🛍️</span>
            </div>
            <p className="mt-3 font-serif text-3xl md:text-4xl font-extrabold text-[#17223B]">
              ₹{summary.totalMarketplaceVolume.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-[#626262]">Total buyer payments online</p>
          </div>

          {/* 3. Total Artist Payouts */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">
                Artist Payouts (Asking)
              </span>
              <span className="text-2xl">🧑‍🎨</span>
            </div>
            <p className="mt-3 font-serif text-3xl md:text-4xl font-extrabold text-[#F83758]">
              ₹{summary.totalArtistPayouts.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-[#626262]">100% of artist asking prices</p>
          </div>

          {/* 4. Total Sold Artworks */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">
                Artworks Sold
              </span>
              <span className="text-2xl">📦</span>
            </div>
            <p className="mt-3 font-serif text-3xl md:text-4xl font-extrabold text-sky-600">
              {summary.totalSoldArtworks}
            </p>
            <p className="mt-1 text-xs text-[#626262]">Acquisitions completed to date</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E8E8] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: `All Sales (${sales.length})` },
              { id: 'physical', label: 'Physical Crafts' },
              { id: 'digital', label: 'Digital Artworks' },
              { id: 'held', label: 'Escrow Held' },
              { id: 'released', label: 'Settled / Released' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                filterType === t.id
                  ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white'
                  : 'bg-[#F3F3F3] text-[#626262] hover:bg-[#E8E8E8] hover:text-[#17223B]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by artwork, buyer, or artist UPI…"
            className="w-full sm:w-72 rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#17223B] placeholder-[#9E9E9E] focus:border-brand focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Sold Artworks Audit Table */}
      {loading ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-16 text-center text-[#626262] text-xs shadow-sm">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-brand border-r-transparent mb-3" />
          <p>Calculating sales commission and loading ledger…</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-16 text-center shadow-sm">
          <span className="text-4xl block mb-2">🏷️</span>
          <p className="font-serif text-lg font-bold text-[#17223B]">No sold artworks found</p>
          <p className="mt-1 text-xs text-[#626262]">
            {searchQuery ? `No sales match "${searchQuery}".` : 'When artworks are sold, their full financial audit trail will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17223B]">
              <thead className="border-b border-[#E8E8E8] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#626262]">
                <tr>
                  <th className="px-5 py-4">Artwork Sold</th>
                  <th className="px-5 py-4">Buyer Details</th>
                  <th className="px-5 py-4">Artist &amp; UPI / QR Code</th>
                  <th className="px-5 py-4">Financial Split</th>
                  <th className="px-5 py-4">Admin Commission (10%)</th>
                  <th className="px-5 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {filteredSales.map((item) => {
                  const art = item.orders?.artworks;
                  const buyer = item.orders?.users;
                  const artist = item.artists;
                  const hasQr = Boolean(artist?.payout_bank_name);

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAFA] transition">
                      {/* 1. Artwork Item */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#FAFAFA]">
                            {art?.image_url ? (
                              <Image
                                src={art.image_url}
                                alt={art.title || 'Artwork'}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8E8E8E]">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            {art?.id ? (
                              <Link
                                href={`/artwork/${art.id}`}
                                target="_blank"
                                className="font-bold text-[#17223B] hover:text-brand transition truncate block text-sm"
                                title={art.title}
                              >
                                {art.title}
                              </Link>
                            ) : (
                              <span className="font-bold text-[#17223B] text-sm truncate block">
                                Fine Art Original
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                                  art?.is_digital
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                                }`}
                              >
                                {art?.is_digital ? 'Digital' : 'Physical Craft'}
                              </span>
                              <span className="text-[10px] text-[#8E8E8E] font-mono">
                                #{item.order_id?.slice(0, 8)}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8E8E8E] block mt-0.5">
                              {new Date(item.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Buyer Details */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#17223B]">
                            {item.orders?.shipping_name || buyer?.name || 'Art Collector'}
                          </span>
                          <span className="text-[11px] text-[#626262]">{buyer?.email || 'Registered Buyer'}</span>
                          {item.orders?.shipping_city && (
                            <span className="text-[10px] text-[#8E8E8E] mt-0.5">
                              📍 {item.orders.shipping_city}, {item.orders.shipping_state || 'India'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Artist & UPI / QR Code */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[#17223B]">
                            {artist?.payout_account_holder || artist?.name || 'Studio Creator'}
                          </span>
                          {artist?.payout_upi_id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {artist.payout_upi_id}
                              </span>
                              <button
                                onClick={() => copyToClipboard(artist.payout_upi_id!, item.id)}
                                title="Copy UPI ID"
                                className="text-[10px] font-bold text-[#F83758] hover:underline"
                              >
                                {copiedUpi === item.id ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium">
                              ⚠️ Bank Transfer on file
                            </span>
                          )}

                          {/* QR Code Action Button */}
                          {hasQr && (
                            <button
                              onClick={() =>
                                setSelectedQrModal({
                                  artistName: artist?.payout_account_holder || artist?.name || 'Artist',
                                  upiId: artist?.payout_upi_id || 'UPI',
                                  qrUrl: artist?.payout_bank_name!,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline mt-0.5"
                            >
                              <span>📱</span> View Artist QR Code
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 4. Financial Split */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-[#626262]">Customer Paid:</span>
                            <span className="font-bold text-[#17223B]">
                              ₹{Number(item.sale_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs gap-3 mt-0.5">
                            <span className="text-[#626262]">Artist Payout (Asking):</span>
                            <span className="font-bold text-[#F83758]">
                              ₹{Number(item.payout_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Admin Commission (10%) */}
                      <td className="px-5 py-4">
                        <div className="inline-flex flex-col rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Credited to Admin
                          </span>
                          <span className="font-serif text-base font-black text-emerald-700">
                            +₹{Number(item.commission_amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-emerald-800/80 font-medium">10% Platform Fee</span>
                        </div>
                      </td>

                      {/* 6. Settlement Status */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                              item.status === 'released'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.status === 'released' ? '✓ Settled' : '⏳ Escrow Held'}
                          </span>
                          {item.transferred_at && (
                            <span className="text-[10px] text-[#8E8E8E]">
                              Transferred on {new Date(item.transferred_at).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Scan Modal */}
      {selectedQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#E8E8E8] bg-white p-6 shadow-2xl text-center">
            <h3 className="font-serif text-lg font-bold text-[#17223B]">
              Artist Payment QR Code
            </h3>
            <p className="text-xs text-[#626262] mt-0.5">
              Scan with GPay, PhonePe, Paytm or BHIM to settle payout to {selectedQrModal.artistName}.
            </p>

            <div className="my-4 relative aspect-square w-64 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-[#DEDBDB] bg-[#FAFAFA] flex items-center justify-center p-2">
              <Image
                src={selectedQrModal.qrUrl}
                alt="Artist UPI QR Code"
                fill
                className="object-contain p-2"
              />
            </div>

            <div className="rounded-xl bg-[#F3F3F3] border border-[#DEDBDB] p-2.5 mb-4">
              <span className="text-[10px] font-bold text-[#8E8E8E] uppercase block">UPI ID</span>
              <span className="font-mono text-xs font-bold text-[#17223B]">{selectedQrModal.upiId}</span>
            </div>

            <button
              onClick={() => setSelectedQrModal(null)}
              className="w-full rounded-xl bg-[#17223B] py-2.5 text-xs font-bold text-white hover:bg-black transition shadow-xs"
            >
              Close QR View
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
