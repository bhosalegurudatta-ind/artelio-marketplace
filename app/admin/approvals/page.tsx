'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

type PendingArtist = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  shop_name: string | null;
  address: string | null;
  approved: boolean;
  created_at: string;
  trial_ends_at: string | null;
};

export default function AdminApprovalsPage() {
  const [artists, setArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadPendingArtists() {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Authentication token missing. Please sign in as an admin.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/approvals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to load pending artists.');
      } else {
        setArtists(data.artists || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with approvals API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingArtists();
  }, []);

  async function handleApprove(artist: PendingArtist) {
    if (!window.confirm(`Approve artist "${artist.name}"? This will activate their account and grant a 30-day free trial.`)) {
      return;
    }

    setActionLoading(artist.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ artistId: artist.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to approve artist.');
      } else {
        setSuccessMsg(`Artist "${artist.name}" approved successfully! 30-day listing trial started.`);
        setArtists((prev) => prev.filter((a) => a.id !== artist.id));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting approval.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-xs font-bold text-amber-300 mb-2">
            <span>🧑‍🎨</span> Artist Curation & Vetting
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">
            Artist Approvals
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Review pending creator atelier applications and grant 30-day listing access.
          </p>
        </div>

        <button
          onClick={loadPendingArtists}
          disabled={loading}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Queue'}
        </button>
      </div>

      <AdminNav active="approvals" />

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-vermilion/30 bg-vermilion/10 p-4 text-xs text-vermilion font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 font-medium">
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-16 text-center text-white/50 text-xs">
          Loading pending artists queue…
        </div>
      ) : artists.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-16 text-center">
          <span className="text-4xl block mb-2">🎉</span>
          <p className="font-serif text-lg font-bold text-white">Approvals Queue is Clear</p>
          <p className="mt-1 text-xs text-white/50">All registered artist accounts are currently vetted and approved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
            Pending Applications ({artists.length})
          </div>

          {artists.map((artist) => (
            <div
              key={artist.id}
              className="rounded-2xl border border-white/10 bg-[#121826] p-6 shadow-md transition-all hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-white">{artist.name}</h2>
                    <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Pending Vetting
                    </span>
                  </div>
                  <p className="text-xs font-mono text-white/60">{artist.email}</p>
                  {artist.shop_name && (
                    <p className="text-xs text-purple-300 font-medium">
                      Atelier: {artist.shop_name}
                    </p>
                  )}
                  {artist.bio ? (
                    <p className="text-xs text-white/80 leading-relaxed pt-2 italic">
                      &ldquo;{artist.bio}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-white/40 pt-2 italic">No artist statement provided.</p>
                  )}
                  <p className="text-[11px] text-white/40 pt-1">
                    Applied on: {new Date(artist.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/artist/${artist.id}`}
                    target="_blank"
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    View Studio Profile ↗
                  </Link>
                  <button
                    onClick={() => handleApprove(artist)}
                    disabled={actionLoading === artist.id}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {actionLoading === artist.id ? 'Approving…' : '✓ Approve Artist (30-Day Trial)'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
