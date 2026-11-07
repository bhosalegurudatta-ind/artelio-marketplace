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
        <Link href="/admin" className="text-xs text-white/50 hover:text-white transition">
          ← Back to Admin Console
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-bold text-white flex items-center gap-3">
          Artist Verification
          <VerifiedBadge size="md" />
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Review qualified resident creators with at least 10 completed sales and no open disputes, and grant official verified status.
        </p>
      </div>

      <AdminNav active="verification" />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
          <p className="text-xs font-medium text-white/60">Qualifying Artists</p>
          <p className="mt-1 text-2xl font-black text-brand-soft">
            {qualifyingArtists.length}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">≥10 completed sales & 0 disputes</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
          <p className="text-xs font-medium text-white/60">Verified Artists</p>
          <p className="mt-1 text-2xl font-black text-sky-400">
            {verifiedCount}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">Displaying verified badge publicly</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121826] p-4">
          <p className="text-xs font-medium text-white/60">Total Platform Artists</p>
          <p className="mt-1 text-2xl font-black text-white">
            {allArtists.length}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">Registered creator profiles</p>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300">
          {successMsg}
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#121826] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('qualifying')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filterMode === 'qualifying'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Qualifying Artists ({qualifyingArtists.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
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
            className="w-full sm:w-64 rounded-xl border border-white/10 bg-[#0B0E17] px-3 py-2 text-xs text-white placeholder-white/40 focus:border-sky-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Artist Table / Cards */}
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-xs text-white/60">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mb-3" />
          <p>Loading artists and calculating verification criteria…</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-12 text-center text-xs text-white/60">
          {filterMode === 'qualifying' ? (
            <div>
              <p className="text-base font-bold text-white mb-1">No Qualifying Artists Found</p>
              <p className="max-w-md mx-auto text-white/50">
                Artists qualify automatically once they reach at least 10 completed sales and have 0 open disputes.
              </p>
              <button
                onClick={() => setFilterMode('all')}
                className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                View All Artists
              </button>
            </div>
          ) : (
            <p>No artists match your search query.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121826]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-4 py-3">Artist / Shop</th>
                  <th className="px-4 py-3">Completed Sales</th>
                  <th className="px-4 py-3">Disputes</th>
                  <th className="px-4 py-3">Sales Volume</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((artist) => {
                  const isProcessing = actionLoadingId === artist.id;
                  const qualifies = artist.completed_sales >= 10 && artist.open_disputes === 0;

                  return (
                    <tr key={artist.id} className="hover:bg-white/2 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/artist/${artist.id}`}
                              className="font-bold text-white hover:text-sky-400 transition"
                            >
                              {artist.shop_name || artist.name}
                            </Link>
                            {artist.verified && <VerifiedBadge size="xs" />}
                          </div>
                          <span className="text-[11px] text-white/50">{artist.email}</span>
                          {artist.shop_name && artist.name && artist.shop_name !== artist.name && (
                            <span className="text-[10px] text-white/40">By {artist.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                            artist.completed_sales >= 10
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/30'
                              : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {artist.completed_sales} {artist.completed_sales === 1 ? 'sale' : 'sales'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {artist.open_disputes === 0 ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                            0 disputes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30">
                            ⚠️ {artist.open_disputes} open
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-white/70">
                        ₹{artist.total_volume.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3.5">
                        {artist.verified ? (
                          <span className="inline-flex items-center gap-1 text-sky-400 font-bold text-xs">
                            <VerifiedBadge size="xs" />
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
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
                              ? 'bg-rose-500/15 border border-rose-400/30 text-rose-300 hover:bg-rose-500/25'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
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
