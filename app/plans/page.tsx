'use client';

import { useState } from 'react';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export default function PlansPage() {
  const [role, setRole] = useState<'artist' | 'customer'>('artist');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'artist' | 'customer'>('artist');

  const plans = Object.values(SUBSCRIPTION_PLANS);

  function openModal(target: 'artist' | 'customer') {
    setSelectedRole(target);
    setUpgradeModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-paper py-14">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <span className="rounded-full bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand uppercase tracking-wider">
            Artelio Memberships
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            Empowering Independent Creators &amp; Collectors
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/70">
            Choose the membership built for your journey. Artists unlock cutting-edge studio AI and zero sales surcharges. Collectors gain room visualization and personal AI interior styling.
          </p>

          {/* Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="flex rounded-full bg-white p-1 border border-ink/10 shadow-sm">
              <button
                type="button"
                onClick={() => setRole('artist')}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  role === 'artist' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-ink'
                }`}
              >
                For Artists (Creator Pro)
              </button>
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                  role === 'customer' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-ink'
                }`}
              >
                For Collectors (Collector Club)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter((p) => p.targetRole === role)
            .map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl border bg-white p-8 transition shadow-sm ${
                  plan.popular ? 'border-brand ring-2 ring-brand/20 shadow-lg' : 'border-ink/10 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
                  <p className="mt-2 text-xs text-ink/60 min-h-[36px]">{plan.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-ink">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-ink/60">/ {plan.billingInterval}</span>
                  </div>

                  <ul className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-xs text-ink/80">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-brand font-bold">✓</span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openModal(plan.targetRole)}
                  className={`mt-8 w-full rounded-full py-3 text-sm font-semibold shadow-sm transition ${
                    plan.popular
                      ? 'bg-brand text-white hover:bg-brand-dark'
                      : 'border border-ink/20 bg-white text-ink hover:border-brand hover:text-brand'
                  }`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
        </div>

        <div className="mt-16 rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-ink">Have custom gallery or institutional curation needs?</p>
          <p className="mt-1 text-xs text-ink/60">
            Reach out to our founder team for custom commissions, corporate exhibitions, and private salon viewings.
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-block text-xs font-semibold text-brand hover:underline"
          >
            Explore marketplace catalog →
          </Link>
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        defaultRole={selectedRole}
      />
    </main>
  );
}
