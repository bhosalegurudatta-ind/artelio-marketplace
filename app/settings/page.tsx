'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { inputClass, labelClass } from '@/lib/ui';

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
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      setProfileMsg({ text: 'Profile & delivery details saved successfully!' });
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
      const payload: any = {
        method: payoutMethod,
        accountHolder,
      };

      if (payoutMethod === 'upi') {
        if (!upiId.trim() || !upiId.includes('@')) {
          throw new Error('Please enter a valid UPI ID (e.g. name@okaxis, 9876543210@paytm)');
        }
        payload.upiId = upiId.trim();
      } else {
        if (!bankName.trim()) throw new Error('Bank name is required.');
        if (!ifsc.trim() || ifsc.trim().length < 8) throw new Error('Valid IFSC code is required.');
        if (!accountNumber.trim() || accountNumber.trim().length < 8) {
          throw new Error('Valid bank account number is required.');
        }
        payload.bankName = bankName.trim();
        payload.ifsc = ifsc.trim().toUpperCase();
        payload.accountNumber = accountNumber.trim();
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12 text-[#17223B]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#F0F0F0] pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#17223B] tracking-tight">
            Account &amp; Payment Settings
          </h1>
          <p className="mt-1 text-xs text-[#626262]">
            Manage your personal profile, shipping details, and sales payout bank / UPI accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-md border border-[#DEDBDB] bg-white px-3.5 py-2 text-xs font-bold text-[#17223B] hover:bg-gray-50 transition shadow-2xs"
          >
            ← View Profile
          </Link>
          {role === 'artist' && (
            <Link
              href="/dashboard/upload"
              className="rounded-md bg-[#F83758] px-3.5 py-2 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
            >
              + Upload Artwork
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[#F0F0F0] pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
            activeTab === 'profile'
              ? 'border-[#F83758] text-[#F83758]'
              : 'border-transparent text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <span>👤</span>
          <span>Profile &amp; Shipping</span>
        </button>

        {role === 'artist' && (
          <button
            onClick={() => setActiveTab('payout')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
              activeTab === 'payout'
                ? 'border-[#F83758] text-[#F83758]'
                : 'border-transparent text-[#626262] hover:text-[#17223B]'
            }`}
          >
            <span>💳</span>
            <span>UPI &amp; Payout Details</span>
            {hasExistingPayout ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-[#FDF0F3] px-2 py-0.5 text-[10px] text-[#F83758] font-bold">
                Required
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-[#DEDBDB] bg-white p-6 sm:p-8 shadow-stylish-card">
          <h2 className="text-base font-black text-[#17223B] mb-1">Personal Details</h2>
          <p className="text-xs text-[#626262] mb-6">
            Update your public name, bio, and delivery destination for art acquisitions.
          </p>

          {profileMsg && (
            <div
              className={`mb-6 rounded-lg border p-3.5 text-xs font-semibold ${
                profileMsg.error
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Phone Number (For Courier Delivery)</span>
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
              <span className={labelClass}>Default Shipping Address</span>
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
                className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-6 py-3 text-xs md:text-sm font-bold text-white shadow-stylish-btn transition active:scale-[0.98] disabled:opacity-60"
              >
                {savingProfile ? 'Saving Changes…' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Payout & UPI Settings */}
      {activeTab === 'payout' && (
        <div className="rounded-2xl border border-[#DEDBDB] bg-white p-6 sm:p-8 shadow-stylish-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#F0F0F0] pb-4">
            <div>
              <h2 className="text-base font-black text-[#17223B] mb-1">Sales Payout Details (UPI / Bank)</h2>
              <p className="text-xs text-[#626262]">
                Whenever your listed artwork is acquired, your 90% revenue is settled automatically to this account via Razorpay upon delivery.
              </p>
            </div>
            <div className="rounded-xl border border-[#F83758]/20 bg-[#FDF0F3] px-3.5 py-2 text-right">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-[#F83758]">
                Your Commission Rate
              </span>
              <span className="text-base font-black text-[#17223B]">90% Net Earnings</span>
            </div>
          </div>

          {payoutMsg && (
            <div
              className={`mb-6 rounded-lg border p-3.5 text-xs font-semibold ${
                payoutMsg.error
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {payoutMsg.text}
            </div>
          )}

          <form onSubmit={handleSavePayout} className="space-y-5">
            {/* Method Chooser */}
            <div>
              <span className={labelClass}>Choose Preferred Payout Method</span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition ${
                    payoutMethod === 'upi'
                      ? 'border-[#F83758] bg-[#FDF0F3] text-[#F83758] shadow-xs'
                      : 'border-[#DEDBDB] bg-[#FAFAFA] text-[#626262] hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl mb-1">⚡</span>
                  <span className="text-xs font-bold text-[#17223B]">UPI ID (Instant Settlement)</span>
                  <span className="text-[10px] text-[#A8A8A9] mt-1">Google Pay, PhonePe, Paytm, BHIM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition ${
                    payoutMethod === 'bank'
                      ? 'border-[#F83758] bg-[#FDF0F3] text-[#F83758] shadow-xs'
                      : 'border-[#DEDBDB] bg-[#FAFAFA] text-[#626262] hover:border-gray-400'
                  }`}
                >
                  <span className="text-2xl mb-1">🏛️</span>
                  <span className="text-xs font-bold text-[#17223B]">Direct Bank Transfer</span>
                  <span className="text-[10px] text-[#A8A8A9] mt-1">Direct to any Indian bank account</span>
                </button>
              </div>
            </div>

            {/* Account Holder Name */}
            <label className="block">
              <span className={labelClass}>Account Holder Full Name <span className="text-[#F83758]">*</span></span>
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
                <span className={labelClass}>UPI ID (VPA) <span className="text-[#F83758]">*</span></span>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm, name@okhdfcbank"
                />
                <span className="mt-1.5 block text-xs text-[#626262]">
                  You can find your UPI ID inside Google Pay, PhonePe, or Paytm under your profile.
                </span>
              </label>
            ) : (
              /* Bank Option Fields */
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Bank Name <span className="text-[#F83758]">*</span></span>
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
                    <span className={labelClass}>IFSC Code <span className="text-[#F83758]">*</span></span>
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
                  <span className={labelClass}>Bank Account Number <span className="text-[#F83758]">*</span></span>
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

            <div className="rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] p-4 text-xs text-[#626262] leading-relaxed">
              🔒 <strong className="text-[#17223B]">Security &amp; Banking Guarantee:</strong> Your payout coordinates are stored with AES-256 encryption and only utilized to release funds after physical artwork delivery is safely confirmed by the collector.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPayout}
                className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-6 py-3 text-xs md:text-sm font-bold text-white shadow-stylish-btn transition active:scale-[0.98] disabled:opacity-60"
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
