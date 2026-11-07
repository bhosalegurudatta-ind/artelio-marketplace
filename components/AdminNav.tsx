import Link from 'next/link';

export default function AdminNav({ active }: { active: 'overview' | 'approvals' | 'reports' | 'listings' | 'payouts' | 'verification' }) {
  const tabs = [
    { id: 'overview', label: '📊 Overview', href: '/admin' },
    { id: 'approvals', label: '🧑‍🎨 Artist Approvals', href: '/admin/approvals' },
    { id: 'reports', label: '🚨 Reports & Moderation', href: '/admin/reports' },
    { id: 'listings', label: '🖼️ Artworks & Listings', href: '/admin/listings' },
    { id: 'payouts', label: '💳 Payouts & Transfers', href: '/admin/payouts' },
    { id: 'verification', label: '✓ Artist Verification', href: '/admin/verification' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 mb-8">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white shadow-md'
                : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
