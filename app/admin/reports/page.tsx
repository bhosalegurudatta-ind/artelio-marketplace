'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

type ReportItem = {
  id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  artwork_id: string;
  artworks: {
    id: string;
    title: string;
    image_url: string | null;
    price: number;
    is_hidden: boolean;
    artist_id: string;
    users?: {
      name: string;
      email: string;
    } | null;
  } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open');

  async function loadReports() {
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

      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to load reports.');
      } else {
        setReports(data.reports || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleSetStatus(reportId: string, status: 'resolved' | 'dismissed') {
    setActionLoading(reportId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update report status.');
      } else {
        setSuccessMsg(`Report marked as ${status}.`);
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating report status.');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 text-xs font-bold text-rose-300 mb-2">
            <span>🚨</span> Listing Integrity & Dispute Resolution
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white tracking-tight">
            Artwork Reports
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Review user-submitted copyright, plagiarism, or inappropriate content reports.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Reports'}
        </button>
      </div>

      <AdminNav active="reports" />

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-semibold text-white/50 mr-2">Status:</span>
        {(['open', 'resolved', 'dismissed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize transition-all ${
              statusFilter === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {tab} ({tab === 'all' ? reports.length : reports.filter((r) => r.status === tab).length})
          </button>
        ))}
      </div>

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
          Loading reports…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-16 text-center">
          <span className="text-4xl block mb-2">🛡️</span>
          <p className="font-serif text-lg font-bold text-white">No Reports Found</p>
          <p className="mt-1 text-xs text-white/50">There are no reports under the &quot;{statusFilter}&quot; status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const art = report.artworks;
            return (
              <div
                key={report.id}
                className="rounded-2xl border border-white/10 bg-[#121826] p-6 shadow-md transition-all hover:border-white/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-6">
                  {/* Left: Artwork & Report Content */}
                  <div className="flex gap-4 max-w-2xl">
                    <div
                      className="h-24 w-20 shrink-0 rounded-xl bg-paper bg-cover bg-center border border-white/10 shadow-sm"
                      style={art?.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            report.status === 'open'
                              ? 'bg-rose-500/20 text-rose-300'
                              : report.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <h2 className="font-serif text-lg font-bold text-white">
                        {art?.title || 'Unknown Artwork'}
                      </h2>
                      {art?.users?.name && (
                        <p className="text-xs text-white/60">
                          Artist: <strong className="text-white">{art.users.name}</strong> ({art.users.email})
                        </p>
                      )}

                      <div className="pt-2">
                        <span className="text-[11px] uppercase font-bold text-rose-400 block tracking-wider">
                          Reason: {report.reason}
                        </span>
                        {report.details && (
                          <p className="text-xs text-white/80 italic mt-0.5 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
                            &ldquo;{report.details}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {art?.id && (
                      <Link
                        href={`/artwork/${art.id}`}
                        target="_blank"
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 text-center transition-colors"
                      >
                        Inspect Artwork ↗
                      </Link>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSetStatus(report.id, 'resolved')}
                        disabled={actionLoading === report.id || report.status === 'resolved'}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40"
                      >
                        ✓ Mark Resolved
                      </button>
                      <button
                        onClick={() => handleSetStatus(report.id, 'dismissed')}
                        disabled={actionLoading === report.id || report.status === 'dismissed'}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors disabled:opacity-40"
                      >
                        ✕ Dismiss
                      </button>
                    </div>
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
