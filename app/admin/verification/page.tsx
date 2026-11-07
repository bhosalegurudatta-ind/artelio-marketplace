'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';
import VerifiedBadge from '@/components/VerifiedBadge';

type EnrichedArtist = {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  shop_name?: string | null;
  banner_url?: string | null;
  verified: boolean;
  created_at: string;
  completed_sales: number;
  open_disputes: number;
  total_volume: number;
  is_eligible: boolean;
};

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [qualifyingArtists, setQualifyingArtists] = useState<EnrichedArtist[]>([]);
  const [allArtists, setAllArtists] = useState<EnrichedArtist[]>([]);
  const [filterMode, setFilterMode] = useState<'qualifying' | 'all'>('qualifying');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function loadData() {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Authentication required. Please sign in as an admin.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/verification', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch artists for verification.');
      }

      setQualifyingArtists(data.artists || []);
      setAllArtists(data.allArtists || []);
    } catch (err: any) {
      console.error('Error loading verification list:', err);
      setErrorMsg(err.message || 'Could not load artist verification data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleVerification(artistId: string, currentVerified: boolean) {
    const nextVerified = !currentVerified;
    setActionLoadingId(artistId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Admin authentication required.');
      }

      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artistId,
          verified: nextVerified,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update verification status.');
      }

      // Update state locally
      setQualifyingArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, verified: nextVerified } : a))
      );
      setAllArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, verified: nextVerified } : a))
      );

      setSuccessMsg(
        nextVerified
          ? `✓ Artist has been verified successfully.`
          : `Verification badge revoked for artist.`
      );
    } catch (err: any) {
      console.error('Error updating verification:', err);
      setErrorMsg(err.message || 'Could not update verification status.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const baseList = filterMode === 'qualifying' ? qualifyingArtists : allArtists;
  const filteredList = baseList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.shop_name && a.shop_name.toLowerCase().includes(q))
    );
  });

  const verifiedCount = allArtists.filter((a) => a.verified).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/admin" className="text-xs font-semibold text-[#626262] hover:text-[#17223B] transition">
          ← Back to Admin Console
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-bold text-[#17223B] flex items-center gap-3">
          Artist Verification
          <VerifiedBadge size="md" />
        </h1>
        <p className="mt-1 text-sm text-[#626262]">
          Review qualified resident creators with at least 10 completed sales and no open disputes, and grant official verified status.
        </p>
      </div>

      <AdminNav active="verification" />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#626262]">Qualifying Artists</p>
          <p className="mt-2 text-3xl font-extrabold text-[#F83758]">
            {qualifyingArtists.length}
          </p>
          <p className="mt-1 text-xs text-[#626262]">≥10 completed sales & 0 disputes</p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#626262]">Verified Artists</p>
          <p className="mt-2 text-3xl font-extrabold text-sky-600">
            {verifiedCount}
          </p>
          <p className="mt-1 text-xs text-[#626262]">Displaying verified badge publicly</p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#626262]">Total Platform Artists</p>
          <p className="mt-2 text-3xl font-extrabold text-[#17223B]">
            {allArtists.length}
          </p>
          <p className="mt-1 text-xs text-[#626262]">Registered creator profiles</p>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-[#E8E8E8] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('qualifying')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              filterMode === 'qualifying'
                ? 'bg-gradient-to-r from-vermilion to-brand text-white'
                : 'bg-[#F3F3F3] text-[#626262] hover:bg-[#E8E8E8] hover:text-[#17223B]'
            }`}
          >
            Qualifying Artists ({qualifyingArtists.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              filterMode === 'all'
                ? 'bg-gradient-to-r from-vermilion to-brand text-white'
                : 'bg-[#F3F3F3] text-[#626262] hover:bg-[#E8E8E8] hover:text-[#17223B]'
            }`}
          >
            All Artists ({allArtists.length})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artist by name or email…"
            className="w-full sm:w-64 rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#17223B] placeholder-[#9E9E9E] focus:border-brand focus:bg-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Artist Table / Cards */}
      {loading ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-12 text-center text-xs text-[#626262] shadow-sm">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mb-3" />
          <p>Loading artists and calculating verification criteria…</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-12 text-center text-xs text-[#626262] shadow-sm">
          {filterMode === 'qualifying' ? (
            <div>
              <p className="text-base font-bold text-[#17223B] mb-1">No Qualifying Artists Found</p>
              <p className="max-w-md mx-auto text-[#626262]">
                Artists qualify automatically once they reach at least 10 completed sales and have 0 open disputes.
              </p>
              <button
                onClick={() => setFilterMode('all')}
                className="mt-4 rounded-xl bg-[#F3F3F3] border border-[#DEDBDB] px-4 py-2 text-xs font-bold text-[#17223B] hover:bg-[#E8E8E8] transition"
              >
                View All Artists
              </button>
            </div>
          ) : (
            <p>No artists match your search query.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17223B]">
              <thead className="border-b border-[#E8E8E8] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#626262]">
                <tr>
                  <th className="px-4 py-3">Artist / Shop</th>
                  <th className="px-4 py-3">Completed Sales</th>
                  <th className="px-4 py-3">Disputes</th>
                  <th className="px-4 py-3">Sales Volume</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {filteredList.map((artist) => {
                  const isProcessing = actionLoadingId === artist.id;
                  const qualifies = artist.completed_sales >= 10 && artist.open_disputes === 0;

                  return (
                    <tr key={artist.id} className="hover:bg-[#FAFAFA] transition">
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/artist/${artist.id}`}
                              className="font-bold text-[#17223B] hover:text-brand transition"
                            >
                              {artist.shop_name || artist.name}
                            </Link>
                            {artist.verified && <VerifiedBadge size="xs" />}
                          </div>
                          <span className="text-[11px] text-[#626262]">{artist.email}</span>
                          {artist.shop_name && artist.name && artist.shop_name !== artist.name && (
                            <span className="text-[10px] text-[#8E8E8E]">By {artist.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                            artist.completed_sales >= 10
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#F3F3F3] text-[#626262]'
                          }`}
                        >
                          {artist.completed_sales} {artist.completed_sales === 1 ? 'sale' : 'sales'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {artist.open_disputes === 0 ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            0 disputes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            ⚠️ {artist.open_disputes} open
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[#17223B] font-medium">
                        ₹{artist.total_volume.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5">
                        {artist.verified ? (
                          <span className="inline-flex items-center gap-1 text-sky-600 font-bold text-xs">
                            <VerifiedBadge size="xs" />
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-[#F3F3F3] px-2 py-0.5 text-[11px] text-[#626262]">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleVerification(artist.id, artist.verified)}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
                            artist.verified
                              ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white shadow-xs'
                          }`}
                        >
                          {isProcessing ? (
                            'Updating…'
                          ) : artist.verified ? (
                            'Revoke Verification'
                          ) : (
                            '✓ Verify Artist'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
