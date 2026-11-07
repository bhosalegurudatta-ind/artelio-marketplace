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
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-700 mb-2">
            <span>🚨</span> Listing Integrity & Dispute Resolution
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#17223B] tracking-tight">
            Artwork Reports
          </h1>
          <p className="mt-1 text-sm text-[#626262]">
            Review user-submitted copyright, plagiarism, or inappropriate content reports.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="rounded-full border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#17223B] hover:bg-[#F3F3F3] shadow-xs transition-colors"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Reports'}
        </button>
      </div>

      <AdminNav active="reports" />

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-bold text-[#626262] mr-2">Status:</span>
        {(['open', 'resolved', 'dismissed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize transition-all shadow-xs ${
              statusFilter === tab
                ? 'bg-[#17223B] text-white'
                : 'border border-[#DEDBDB] bg-white text-[#626262] hover:bg-[#F3F3F3]'
            }`}
          >
            {tab} ({tab === 'all' ? reports.length : reports.filter((r) => r.status === tab).length})
          </button>
        ))}
      </div>

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
          Loading reports…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-16 text-center shadow-sm">
          <span className="text-4xl block mb-2">🛡️</span>
          <p className="font-serif text-lg font-bold text-[#17223B]">No Reports Found</p>
          <p className="mt-1 text-xs text-[#626262]">There are no reports under the &quot;{statusFilter}&quot; status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const art = report.artworks;
            return (
              <div
                key={report.id}
                className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm transition-all hover:border-[#DEDBDB]"
              >
                <div className="flex flex-wrap items-start justify-between gap-6">
                  {/* Left: Artwork & Report Content */}
                  <div className="flex gap-4 max-w-2xl">
                    <div
                      className="h-24 w-20 shrink-0 rounded-xl bg-paper bg-cover bg-center border border-[#E8E8E8] shadow-sm"
                      style={art?.image_url ? { backgroundImage: `url(${art.image_url})` } : undefined}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            report.status === 'open'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-[11px] text-[#8E8E8E]">
                          {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <h2 className="font-serif text-lg font-bold text-[#17223B]">
                        {art?.title || 'Unknown Artwork'}
                      </h2>
                      {art?.users?.name && (
                        <p className="text-xs text-[#626262]">
                          Artist: <strong className="text-[#17223B]">{art.users.name}</strong> ({art.users.email})
                        </p>
                      )}

                      <div className="pt-2">
                        <span className="text-[11px] uppercase font-bold text-rose-700 block tracking-wider">
                          Reason: {report.reason}
                        </span>
                        {report.details && (
                          <p className="text-xs text-[#17223B] italic mt-1 leading-relaxed bg-[#FAFAFA] p-2.5 rounded-lg border border-[#E8E8E8]">
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
                        className="rounded-full border border-[#DEDBDB] bg-[#FAFAFA] px-4 py-1.5 text-xs font-semibold text-[#17223B] hover:bg-[#F3F3F3] text-center transition-colors"
                      >
                        Inspect Artwork ↗
                      </Link>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSetStatus(report.id, 'resolved')}
                        disabled={actionLoading === report.id || report.status === 'resolved'}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-xs"
                      >
                        ✓ Mark Resolved
                      </button>
                      <button
                        onClick={() => handleSetStatus(report.id, 'dismissed')}
                        disabled={actionLoading === report.id || report.status === 'dismissed'}
                        className="rounded-full border border-[#DEDBDB] bg-white px-4 py-1.5 text-xs font-semibold text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B] transition-colors disabled:opacity-40"
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
