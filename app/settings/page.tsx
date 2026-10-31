'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass, primaryButton } from '@/lib/ui';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'payout'>('profile');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [payoutMsg, setPayoutMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'artist' | 'customer'>('customer');

  // Payout fields
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [hasExistingPayout, setHasExistingPayout] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }
      setEmail(authData.user.email || '');

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      // 1. Fetch Profile
      try {
        const pRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pData = await pRes.json();
        if (pData?.profile) {
          setName(pData.profile.name || '');
          setBio(pData.profile.bio || '');
          setAddress(pData.profile.address || '');
          setPhone(pData.profile.phone || '');
          setRole(pData.profile.role === 'artist' ? 'artist' : 'customer');
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }

      // 2. Fetch Payout Details
      try {
        const payRes = await fetch('/api/artist/payout-settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payData = await payRes.json();
        if (payData && payData.configured) {
          setHasExistingPayout(true);
          setPayoutMethod(payData.method || 'upi');
          setUpiId(payData.upiId || '');
          setAccountHolder(payData.accountHolder || '');
          setBankName(payData.bankName || '');
          setIfsc(payData.ifsc || '');
        }
      } catch (e) {
        console.error('Failed to load payout details:', e);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, address, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update profile.');
      setProfileMsg({ text: 'Profile changes saved successfully!' });
    } catch (err: any) {
      setProfileMsg({ text: err.message, error: true });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayout(true);
    setPayoutMsg(null);

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) return;

    try {
      const payload: Record<string, any> = {
        method: payoutMethod,
        accountHolder: accountHolder.trim() || name.trim(),
      };

      if (payoutMethod === 'upi') {
        payload.upiId = upiId.trim();
      } else {
        payload.bankName = bankName.trim();
        payload.accountNumber = accountNumber.trim();
        payload.ifsc = ifsc.trim().toUpperCase();
      }

      const res = await fetch('/api/artist/payout-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payout settings.');

      setPayoutMsg({ text: 'Payment & UPI payout details saved successfully!' });
      setHasExistingPayout(true);
    } catch (err: any) {
      setPayoutMsg({ text: err.message, error: true });
    } finally {
      setSavingPayout(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-5 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white md:text-4xl">
            Account & Payment Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your personal profile, shipping details, and sales payout bank / UPI accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
          >
            ← View Profile
          </Link>
          {role === 'artist' && (
            <Link
              href="/dashboard/upload"
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition"
            >
              + Upload Artwork
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'profile'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>👤</span>
          <span>Profile & Shipping</span>
        </button>

        {role === 'artist' && (
          <button
            onClick={() => setActiveTab('payout')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'payout'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>💳</span>
            <span>UPI & Payout Details</span>
            {hasExistingPayout ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-500/30">
                Required for sellers
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1">Personal Details</h2>
          <p className="text-xs text-slate-400 mb-6">
            Update your public name, bio, and delivery destination for art acquisitions.
          </p>

          {profileMsg && (
            <div
              className={`mb-6 rounded-xl border p-3.5 text-xs ${
                profileMsg.error
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Full Name</span>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </label>

              <label className="block">
                <span className={labelClass}>Email Address (Read-only)</span>
                <input
                  type="email"
                  disabled
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                  value={email}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Phone Number (For Courier OTP & Delivery)</span>
                <input
                  type="tel"
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="block">
                <span className={labelClass}>Account Mode</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'artist' | 'customer')}
                  className={inputClass}
                >
                  <option value="customer">Collector / Buyer</option>
                  <option value="artist">Artist / Creator Atelier</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Bio / Studio Statement</span>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your artistic background, medium preferences, or collector interests…"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Default Shipping Address (For Artwork Deliveries)</span>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, apartment, city, state, postal code"
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className={primaryButton}
              >
                {savingProfile ? 'Saving Changes…' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Payout & UPI Settings */}
      {activeTab === 'payout' && (
        <div className="rounded-2xl border border-white/10 bg-[#121826] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Sales Payout Details (UPI / Bank)</h2>
              <p className="text-xs text-slate-400">
                Whenever your listed artwork is acquired, your 90% revenue is settled automatically to this account via Razorpay Escrow upon delivery.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-right">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Your Commission Rate
              </span>
              <span className="font-serif text-lg font-bold text-white">90% Net Earnings</span>
            </div>
          </div>

          {payoutMsg && (
            <div
              className={`mb-6 rounded-xl border p-3.5 text-xs ${
                payoutMsg.error
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {payoutMsg.text}
            </div>
          )}

          <form onSubmit={handleSavePayout} className="space-y-6">
            {/* Method Chooser */}
            <div>
              <span className={labelClass}>Choose Preferred Payout Method</span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition ${
                    payoutMethod === 'upi'
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-2xl mb-1">⚡</span>
                  <span className="text-xs font-bold">UPI ID (Instant Settlement)</span>
                  <span className="text-[10px] text-slate-400 mt-1">Google Pay, PhonePe, Paytm, BHIM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition ${
                    payoutMethod === 'bank'
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-2xl mb-1">🏛️</span>
                  <span className="text-xs font-bold">Direct Bank Transfer (NEFT/RTGS)</span>
                  <span className="text-[10px] text-slate-400 mt-1">Direct to any Indian bank account</span>
                </button>
              </div>
            </div>

            {/* Account Holder Name */}
            <label className="block">
              <span className={labelClass}>Account Holder Full Name <span className="text-amber-400">*</span></span>
              <input
                type="text"
                required
                className={inputClass}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Full name as registered with your bank or UPI provider"
              />
            </label>

            {/* UPI Option Fields */}
            {payoutMethod === 'upi' ? (
              <label className="block">
                <span className={labelClass}>UPI ID (VPA) <span className="text-amber-400">*</span></span>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm, name@okhdfcbank"
                />
                <span className="mt-1.5 block text-xs text-slate-400">
                  You can find your UPI ID inside Google Pay, PhonePe, or Paytm under your profile.
                </span>
              </label>
            ) : (
              /* Bank Option Fields */
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Bank Name <span className="text-amber-400">*</span></span>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                    />
                  </label>

                  <label className="block">
                    <span className={labelClass}>IFSC Code <span className="text-amber-400">*</span></span>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={labelClass}>Bank Account Number <span className="text-amber-400">*</span></span>
                  <input
                    type="password"
                    required
                    className={inputClass}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter full bank account number"
                  />
                </label>
              </div>
            )}

            <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-xs text-slate-400 leading-relaxed">
              🔒 <strong className="text-white">Security & Banking Guarantee:</strong> Your payment coordinates are stored with AES-256 encryption and only utilized to release funds after physical artwork delivery is safely confirmed by the collector.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPayout}
                className={primaryButton}
              >
                {savingPayout ? 'Saving Payment Details…' : 'Save Payment & Payout Details'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
