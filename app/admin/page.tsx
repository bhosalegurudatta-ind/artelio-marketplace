'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

type OverviewStats = {
  totalUsers: number;
  totalArtists: number;
  approvedArtists: number;
  totalOrders: number;
  commissionTotal: number;
  openReports: number;
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setErrorMsg('Please log in with an administrator account.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/overview', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || 'Access denied. Administrator privileges required.');
          setLoading(false);
          return;
        }

        setStats(data.stats);
        setAdminUser(data.user);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load administrator overview.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center text-[#626262]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-[#626262]">Verifying Administrator Privileges…</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-[#17223B] shadow-lg">
          <span className="text-4xl block mb-2">🛑</span>
          <h1 className="font-serif text-2xl font-bold text-[#17223B]">Access Restricted</h1>
          <p className="mt-2 text-xs text-[#626262] leading-relaxed">{errorMsg}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand px-6 py-2 text-xs font-bold text-white shadow-md"
            >
              Log In as Admin
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#DEDBDB] bg-white px-6 py-2 text-xs font-semibold text-[#17223B] hover:bg-[#F3F3F3] shadow-xs"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand mb-2">
            <span>🛡️</span> Artelio Central Command
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-[#17223B] tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#626262]">
            Platform governance, artist vetting, catalog moderation, and financial ledgers.
          </p>
        </div>

        {adminUser && (
          <div className="rounded-xl border border-[#E8E8E8] bg-white px-4 py-2 text-xs shadow-xs">
            <span className="text-[#626262] block text-[10px] uppercase font-mono tracking-wider font-semibold">Signed In As</span>
            <span className="font-bold text-[#17223B]">{adminUser.name || adminUser.email}</span>
            <span className="ml-2 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              ADMIN
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <AdminNav active="overview" />

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {/* 1. Total Users */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">Total Users</span>
              <span className="text-2xl">👥</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-[#17223B]">
              {stats.totalUsers.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-[#626262]">All registered collectors, artists & staff</p>
          </div>

          {/* 2. Total Artists */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">Artists</span>
              <span className="text-2xl">🧑‍🎨</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-purple-700">
              {stats.totalArtists.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-[#626262]">Registered creator accounts on Artelio</p>
          </div>

          {/* 3. Approved Artists */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">Approved Artists</span>
              <span className="text-2xl">✓</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-emerald-600">
              {stats.approvedArtists.toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-[#626262]">Active verified studio sellers</span>
              {stats.totalArtists - stats.approvedArtists > 0 && (
                <Link
                  href="/admin/approvals"
                  className="font-bold text-amber-600 hover:underline"
                >
                  {stats.totalArtists - stats.approvedArtists} pending approval →
                </Link>
              )}
            </div>
          </div>

          {/* 4. Total Orders */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#626262]">Total Orders</span>
              <span className="text-2xl">📦</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-sky-600">
              {stats.totalOrders.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-[#626262]">Physical & digital artwork acquisitions</p>
          </div>

          {/* 5. Commission Total */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Commission Total (10%)</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-amber-700">
              ₹{stats.commissionTotal.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-amber-800/80">Cumulative platform revenue earned</p>
          </div>

          {/* 6. Open Reports */}
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Open Reports</span>
              <span className="text-2xl">🚨</span>
            </div>
            <p className="mt-4 font-serif text-3xl md:text-4xl font-extrabold text-rose-600">
              {stats.openReports.toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-[#626262]">Flagged listings awaiting review</span>
              {stats.openReports > 0 && (
                <Link
                  href="/admin/reports"
                  className="font-bold text-rose-600 hover:underline"
                >
                  Review reports →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6 md:p-8 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-[#17223B] mb-4">Governance & Curatorial Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/approvals"
            className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 hover:border-brand hover:bg-[#FDF0F3] hover:shadow-xs transition-all group"
          >
            <span className="text-3xl">🧑‍🎨</span>
            <div>
              <p className="font-bold text-[#17223B] text-sm group-hover:text-brand transition-colors">Vetting & Approvals</p>
              <p className="text-xs text-[#626262]">Review artist applications and grant 30-day listing trials.</p>
            </div>
          </Link>

          <Link
            href="/admin/verification"
            className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 hover:border-brand hover:bg-[#FDF0F3] hover:shadow-xs transition-all group"
          >
            <span className="text-3xl">✓</span>
            <div>
              <p className="font-bold text-[#17223B] text-sm group-hover:text-brand transition-colors">Artist Verification</p>
              <p className="text-xs text-[#626262]">Award verified badges to creators with ≥10 completed sales & 0 disputes.</p>
            </div>
          </Link>

          <Link
            href="/admin/payouts"
            className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 hover:border-brand hover:bg-[#FDF0F3] hover:shadow-xs transition-all group"
          >
            <span className="text-3xl">💳</span>
            <div>
              <p className="font-bold text-[#17223B] text-sm group-hover:text-brand transition-colors">Payouts Ledger</p>
              <p className="text-xs text-[#626262]">Monitor escrow releases, bank transfers and retry failed payouts.</p>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 hover:border-brand hover:bg-[#FDF0F3] hover:shadow-xs transition-all group"
          >
            <span className="text-3xl">🚨</span>
            <div>
              <p className="font-bold text-[#17223B] text-sm group-hover:text-brand transition-colors">Infringement Reports</p>
              <p className="text-xs text-[#626262]">Resolve or dismiss copyright and policy dispute reports.</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
