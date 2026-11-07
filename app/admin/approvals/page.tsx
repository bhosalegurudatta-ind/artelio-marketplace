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
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 mb-2">
            <span>🧑‍🎨</span> Artist Curation & Vetting
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#17223B] tracking-tight">
            Artist Approvals
          </h1>
          <p className="mt-1 text-sm text-[#626262]">
            Review pending creator atelier applications and grant 30-day listing access.
          </p>
        </div>

        <button
          onClick={loadPendingArtists}
          disabled={loading}
          className="rounded-full border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#17223B] hover:bg-[#F3F3F3] shadow-xs transition-colors"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Queue'}
        </button>
      </div>

      <AdminNav active="approvals" />

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 font-medium">
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-16 text-center text-[#626262] text-xs shadow-sm">
          Loading pending artists queue…
        </div>
      ) : artists.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-16 text-center shadow-sm">
          <span className="text-4xl block mb-2">🎉</span>
          <p className="font-serif text-lg font-bold text-[#17223B]">Approvals Queue is Clear</p>
          <p className="mt-1 text-xs text-[#626262]">All registered artist accounts are currently vetted and approved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#626262] mb-2">
            Pending Applications ({artists.length})
          </div>

          {artists.map((artist) => (
            <div
              key={artist.id}
              className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm transition-all hover:border-[#DEDBDB]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-[#17223B]">{artist.name}</h2>
                    <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Pending Vetting
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#626262]">{artist.email}</p>
                  {artist.shop_name && (
                    <p className="text-xs text-brand font-semibold">
                      Atelier: {artist.shop_name}
                    </p>
                  )}
                  {artist.bio ? (
                    <p className="text-xs text-[#17223B]/80 leading-relaxed pt-2 italic">
                      &ldquo;{artist.bio}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-[#8E8E8E] pt-2 italic">No artist statement provided.</p>
                  )}
                  <p className="text-[11px] text-[#8E8E8E] pt-1">
                    Applied on: {new Date(artist.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/artist/${artist.id}`}
                    target="_blank"
                    className="rounded-full border border-[#DEDBDB] bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#17223B] hover:bg-[#F3F3F3] transition-colors"
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
