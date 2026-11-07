'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BillingData {
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    commissionRate: string;
    trialDays: number;
    description: string;
  };
  trialDaysLeft: number;
  trialEndsAt: string | null;
  paidUntil: string | null;
  subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'expired' | string;
  subscriptionId: string | null;
  isTestMode: boolean;
  keyId: string;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchBilling() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/login?next=/dashboard/billing');
        return;
      }

      const res = await fetch('/api/subscriptions/create', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load billing information.');
      }

      setBilling(data);
    } catch (err: any) {
      console.error('Fetch billing error:', err);
      setErrorMsg(err.message || 'Could not load billing information.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBilling();
  }, []);

  async function handleSubscribe() {
    setSubscribing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push('/login?next=/dashboard/billing');
        return;
      }

      // 1. Call server-only route to create Razorpay subscription
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not initiate subscription.');
      }

      const subscriptionId = data.subscriptionId || data.subscription_id;
      const keyId = data.keyId;

      // 2. Open Razorpay Checkout modal (Test Mode)
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: keyId,
          subscription_id: subscriptionId,
          name: 'Artelio Atelier',
          description: 'Artist Atelier Monthly Subscription - ₹499/month',
          image: '/favicon.ico',
          handler: async function (response: any) {
            setSuccessMsg('Payment received! Subscription is being processed.');
            await fetchBilling();
          },
          prefill: {
            name: sessionData.session?.user?.email?.split('@')[0] || 'Artist',
            email: sessionData.session?.user?.email || '',
          },
          theme: {
            color: '#F83758',
          },
          modal: {
            ondismiss: function () {
              setSubscribing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMsg(resp?.error?.description || 'Subscription payment was not completed.');
          setSubscribing(false);
        });
        rzp.open();
      } else {
        // Fallback if Razorpay SDK script not loaded yet
        setSuccessMsg(`Subscription ${subscriptionId} created. Processing test mode activation...`);
        await fetchBilling();
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setErrorMsg(err.message || 'Failed to start subscription.');
    } finally {
      setSubscribing(false);
    }
  }

  // Simulator for Razorpay Test Mode webhook testing
  async function handleSimulateWebhook(action: 'charge' | 'cancel') {
    setTestingWebhook(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Not logged in');

      // Test webhook call via internal test API or direct payload test
      const testEvent = action === 'charge' ? 'subscription.charged' : 'subscription.cancelled';
      const testPayload = {
        event: testEvent,
        payload: {
          subscription: {
            entity: {
              id: billing?.subscriptionId || `sub_test_${Date.now()}`,
              status: action === 'charge' ? 'active' : 'cancelled',
              notes: {
                user_id: userId,
              },
            },
          },
        },
      };

      const res = await fetch('/api/test/razorpay-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Webhook test failed');
      }

      setSuccessMsg(
        action === 'charge'
          ? '✓ Test Webhook: Subscription charged! 30 days added to paid_until, status is active.'
          : '✓ Test Webhook: Subscription cancelled! Access remains valid until end of current period.'
      );
      await fetchBilling();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to simulate webhook event.');
    } finally {
      setTestingWebhook(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center text-[#17223B]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent mb-4" />
        <p className="text-sm text-gray-500 font-medium">Loading Atelier Billing...</p>
      </main>
    );
  }

  const isSubscribed = billing?.subscriptionStatus === 'active';
  const isCancelled = billing?.subscriptionStatus === 'cancelled';
  const trialDays = billing?.trialDaysLeft ?? 0;
  const paidUntilDate = billing?.paidUntil ? new Date(billing.paidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-12 text-[#17223B]">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold text-[#F83758] hover:underline"
          >
            <span>&larr;</span> Back to Creator Dashboard
          </Link>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700">
            ⚡ Razorpay Test Mode
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#17223B] sm:text-3xl">
            Artist Atelier Subscription &amp; Billing
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
            Manage your atelier membership, 30-day free trial, transparent 10% commission accounting, and listing access.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Billing Overview Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
          {/* Card 1: Plan Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Current Plan</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-[#17223B]">₹499</span>
              <span className="text-xs text-gray-500 font-medium">/ month</span>
            </div>
            <p className="mt-2 text-xs font-bold text-[#F83758]">Artist Atelier Pro</p>
            <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
              10% commission on sales. Payment held until buyer receipt or 7/10 days after shipment.
            </p>
          </div>

          {/* Card 2: Trial Days Left */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Free Trial Status</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-[#17223B]">
                {trialDays > 0 ? `${trialDays} Days` : 'Expired'}
              </span>
              {trialDays > 0 && <span className="text-xs text-gray-500 font-medium">left</span>}
            </div>
            <p className={`mt-2 text-xs font-bold ${trialDays > 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {trialDays > 0 ? `30-Day Free Artist Trial` : 'Trial Window Concluded'}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
              {trialDays > 0
                ? `Full marketplace listing privileges without subscription fees during your initial 30 days.`
                : `Subscribe to maintain uninterrupted studio listings and AI workspace tools.`}
            </p>
          </div>

          {/* Card 3: Subscription Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Subscription Status</span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isSubscribed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isCancelled
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : trialDays > 0
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                <span>{isSubscribed ? '✓' : isCancelled ? '⚠️' : '✦'}</span>
                <span className="capitalize">{billing?.subscriptionStatus || 'Trial'}</span>
              </span>
            </div>
            {paidUntilDate && (
              <p className="mt-2 text-xs text-gray-600">
                Paid access valid until: <strong className="text-[#17223B]">{paidUntilDate}</strong>
              </p>
            )}
            {billing?.subscriptionId && (
              <p className="mt-1 text-[10px] text-gray-400 font-mono truncate">
                Sub ID: {billing.subscriptionId}
              </p>
            )}
          </div>
        </div>

        {/* Subscribe Action Hero Card */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-[#FDF0F3] p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded bg-[#F83758]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#F83758] mb-2">
                <span>🎨</span> ARTELIO CREATOR ATELIER
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#17223B]">
                {isSubscribed ? 'Your Subscription is Active' : 'Subscribe to Artist Atelier'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                Includes verified atelier profile, unlimited artwork uploads, watermarked image protections, AI room visualizer previews, and certified Certificate of Authenticity generation.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> 30-Day Free Trial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> ₹499 / Month After Trial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> 10% Flat Marketplace Commission
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Cancel Anytime
                </span>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto shrink-0">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full sm:w-auto rounded-xl bg-[#F83758] hover:bg-[#E02244] px-8 py-3.5 text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 disabled:opacity-50 text-center"
              >
                {subscribing ? 'Initializing Razorpay...' : isSubscribed ? 'Renew / Extend Subscription' : 'Subscribe Now — ₹499/mo'}
              </button>
              <span className="text-[11px] text-gray-400 text-center sm:text-right">
                Tested securely via Razorpay Test Mode
              </span>
            </div>
          </div>
        </div>

        {/* Razorpay Test Mode Tools */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧪</span>
            <h3 className="text-sm font-bold text-blue-900">Razorpay Test Mode Developer Console</h3>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed mb-4">
            Test the automated subscription lifecycle webhook handlers with verified HMAC signatures without needing an external webhook tunnel:
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSimulateWebhook('charge')}
              disabled={testingWebhook}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {testingWebhook ? 'Simulating…' : '⚡ Simulate subscription.charged (Adds 30 days)'}
            </button>

            <button
              onClick={() => handleSimulateWebhook('cancel')}
              disabled={testingWebhook}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {testingWebhook ? 'Simulating…' : '⚠️ Simulate subscription.cancelled (Preserves period)'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
