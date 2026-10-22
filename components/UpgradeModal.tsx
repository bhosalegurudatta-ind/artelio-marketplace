'use client';

import { useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { SUBSCRIPTION_PLANS, Plan } from '@/lib/plans';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradeModal({
  isOpen,
  onClose,
  defaultRole = 'artist',
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'artist' | 'customer';
  onSuccess?: () => void;
}) {
  const [role, setRole] = useState<'artist' | 'customer'>(defaultRole);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const relevantPlans = Object.values(SUBSCRIPTION_PLANS).filter(
    (p) => p.targetRole === role
  );

  async function handleSubscribe(plan: Plan) {
    setLoadingPlan(plan.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Please log in before upgrading.');
      }

      // 1. Create order on backend
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Could not start upgrade.');
      }

      if (!window.Razorpay) {
        throw new Error('Payment gateway is loading. Please try again in a few seconds.');
      }

      // 2. Open Razorpay Checkout modal
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Artelio Marketplace',
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        handler: async (paymentResponse: any) => {
          // 3. Verify signature on backend
          const verifyRes = await fetch('/api/subscriptions/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(paymentResponse),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setErrorMsg(verifyData.error || 'Payment verification failed.');
          } else {
            setSuccessMsg(verifyData.message || 'Plan activated successfully!');
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1800);
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
        prefill: {
          email: sessionData.session?.user?.email || '',
        },
        theme: {
          color: '#0E8ACF',
        },
      });

      rzp.on('payment.failed', (failData: any) => {
        setErrorMsg(failData.error?.description || 'Payment failed.');
        setLoadingPlan(null);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing upgrade.');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="relative my-6 w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-ink/10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 bg-paper/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold">
                ✦
              </span>
              <div>
                <h2 className="text-lg font-bold text-ink">Upgrade Your Artelio Plan</h2>
                <p className="text-xs text-ink/60">Unlock advanced AI tools and unlimited marketplace capabilities</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Role switch toggle */}
            <div className="mb-6 flex justify-center">
              <div className="flex rounded-full bg-paper p-1 border border-ink/10">
                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`rounded-full px-5 py-1.5 text-xs font-semibold transition ${
                    role === 'artist' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  Artist (Creator Pro)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`rounded-full px-5 py-1.5 text-xs font-semibold transition ${
                    role === 'customer' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  Collector (Collector Club)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-green-500/30 bg-green-50 p-3 text-xs text-green-700 font-semibold text-center">
                ✓ {successMsg}
              </div>
            )}

            {/* Plans Grid */}
            <div className={`grid gap-4 ${relevantPlans.length > 1 ? 'sm:grid-cols-2' : 'max-w-md mx-auto'}`}>
              {relevantPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 transition ${
                    plan.popular
                      ? 'border-brand bg-brand/[0.02] shadow-md'
                      : 'border-ink/15 bg-white shadow-sm hover:border-ink/30'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-ink">{plan.name}</h3>
                    <p className="mt-1 text-xs text-ink/60 min-h-[32px]">{plan.description}</p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-ink">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-ink/60">/ {plan.billingInterval}</span>
                    </div>

                    <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-xs text-ink/80">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-brand font-bold">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan === plan.id}
                    className={`mt-6 w-full rounded-full py-2.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white hover:shadow-art-glow hover:scale-[1.01]'
                        : 'border border-ink/20 bg-white text-ink hover:border-brand hover:text-brand'
                    }`}
                  >
                    {loadingPlan === plan.id ? 'Opening Razorpay…' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[11px] text-ink/50">
              Secured by Razorpay • Instant access upon completion • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
