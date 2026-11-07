'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface PayoutAccountData {
  linkedAccountId: string | null;
  kycStatus: string;
  accountHolder: string;
  bankName: string;
  ifsc: string;
  accountNumberMasked: string | null;
  isConfigured: boolean;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [accountData, setAccountData] = useState<PayoutAccountData | null>(null);

  // Form fields
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');

  async function loadAccountDetails() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/login?next=/dashboard/payouts');
        return;
      }

      const res = await fetch('/api/payouts/account', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load payout account details.');
      }

      setAccountData(data);
      if (data.accountHolder) setBeneficiaryName(data.accountHolder);
      if (data.bankName) setBankName(data.bankName);
      if (data.ifsc) setIfsc(data.ifsc);
    } catch (err: any) {
      console.error('Error loading account:', err);
      setErrorMsg(err.message || 'Could not load linked account settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccountDetails();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (accountNumber !== confirmAccount) {
      setErrorMsg('Bank account numbers do not match. Please verify.');
      return;
    }

    if (!/^\d{9,18}$/.test(accountNumber.trim())) {
      setErrorMsg('Bank account number must be between 9 and 18 digits.');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      setErrorMsg('Please enter a valid 11-character Indian IFSC code (e.g. HDFC0001234).');
      return;
    }

    setSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Please log in to continue.');

      const res = await fetch('/api/payouts/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          beneficiaryName,
          businessName,
          bankName,
          accountNumber,
          ifsc: ifsc.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to link bank account with Razorpay Route.');
      }

      setSuccessMsg('✓ Bank account successfully linked! Automatic Razorpay Route payouts are now active.');
      setAccountNumber('');
      setConfirmAccount('');
      await loadAccountDetails();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Could not link bank account.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-[#17223B]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent mb-4" />
        <p className="text-sm font-medium text-gray-500">Loading payout settings...</p>
      </main>
    );
  }

  const isLinked = Boolean(accountData?.linkedAccountId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12 text-[#17223B]">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-[#F83758] hover:underline"
        >
          <span>&larr;</span> Back to Creator Dashboard
        </Link>
        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700">
          ⚡ Razorpay Route Payouts
        </span>
      </div>

      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#17223B] sm:text-3xl">
          Automatic Bank Payouts
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
          Connect your bank account via Razorpay Route. When artwork delivery is confirmed, your 90% artist proceeds are automatically transferred directly to your bank.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Linked Account Status Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Razorpay Route Status</span>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isLinked
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span>{isLinked ? '✓' : '⚠️'}</span>
                <span>{isLinked ? 'Linked & Active' : 'Not Connected'}</span>
              </span>

              {accountData?.kycStatus && (
                <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 capitalize">
                  KYC: {accountData.kycStatus.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {accountData?.linkedAccountId && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Linked Account ID</span>
              <p className="font-mono text-xs font-semibold text-[#17223B]">{accountData.linkedAccountId}</p>
            </div>
          )}
        </div>

        {/* Existing Details Display */}
        {isLinked && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-gray-400 font-semibold block text-[11px]">Beneficiary Name</span>
              <span className="font-bold text-[#17223B] mt-0.5 block">{accountData?.accountHolder || '—'}</span>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-gray-400 font-semibold block text-[11px]">Bank Account</span>
              <span className="font-mono font-bold text-[#17223B] mt-0.5 block">
                {accountData?.accountNumberMasked || '•••• •••• ••••'}
              </span>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <span className="text-gray-400 font-semibold block text-[11px]">IFSC Code</span>
              <span className="font-mono font-bold text-[#17223B] mt-0.5 block">{accountData?.ifsc || '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bank Account Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#17223B]">
            {isLinked ? 'Update Bank Account Details' : 'Enter Bank Account Details'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Funds are deposited in Indian Rupees (INR) via direct NEFT/IMPS bank transfer as soon as each payout is released.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Beneficiary Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Beneficiary Name (as per Bank Passbook) <span className="text-[#F83758]">*</span>
              </label>
              <input
                type="text"
                required
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="e.g. Ramesh Kumar Sharma"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Business / Atelier Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Studio / Business Name (Optional)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Artelio Creations Studio"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Bank Account Number <span className="text-[#F83758]">*</span>
              </label>
              <input
                type="password"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter 9–18 digit account number"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm font-mono text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Confirm Account Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Confirm Bank Account Number <span className="text-[#F83758]">*</span>
              </label>
              <input
                type="text"
                required
                value={confirmAccount}
                onChange={(e) => setConfirmAccount(e.target.value)}
                placeholder="Re-enter bank account number"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm font-mono text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                IFSC Code <span className="text-[#F83758]">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm font-mono uppercase text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
              <p className="mt-1 text-[11px] text-gray-400">11 characters from your cheque book or bank statement.</p>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-xs sm:text-sm text-[#17223B] placeholder-gray-400 focus:bg-white focus:border-[#F83758] focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="rounded-xl bg-[#FDF0F3] border border-[#F83758]/20 p-4 text-xs text-[#17223B]">
            <p className="font-bold flex items-center gap-1.5 text-[#F83758]">
              <span>🛡️</span> Escrow Protection &amp; Direct Bank Settlement
            </p>
            <p className="mt-1 text-gray-600 leading-relaxed text-[11px]">
              Customer funds remain protected in verified Razorpay escrow during transit. The moment safe delivery is confirmed, Razorpay Route initiates an automated bank transfer of your net sales proceeds directly to this linked account.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#F83758] hover:bg-[#E02244] px-8 py-3 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Connecting with Razorpay Route…' : isLinked ? 'Update Bank Account' : 'Connect Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
