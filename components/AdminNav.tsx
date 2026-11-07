import Link from 'next/link';

export default function AdminNav({ active }: { active: 'overview' | 'sales' | 'approvals' | 'reports' | 'listings' | 'payouts' | 'verification' }) {
  const tabs = [
    { id: 'overview', label: '📊 Overview', href: '/admin' },
    { id: 'sales', label: '💰 Sales & Admin Earnings', href: '/admin/sales' },
    { id: 'approvals', label: '🧑‍🎨 Artist Approvals', href: '/admin/approvals' },
    { id: 'reports', label: '🚨 Reports & Moderation', href: '/admin/reports' },
    { id: 'listings', label: '🖼️ Artworks & Listings', href: '/admin/listings' },
    { id: 'payouts', label: '💳 Payouts & Transfers', href: '/admin/payouts' },
    { id: 'verification', label: '✓ Artist Verification', href: '/admin/verification' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E8E8] pb-4 mb-8">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              isActive
                ? 'bg-gradient-to-r from-vermilion via-magenta to-brand text-white shadow-md'
                : 'bg-white border border-[#DEDBDB] text-[#626262] hover:text-[#17223B] hover:border-[#17223B] hover:bg-[#F3F3F3]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          const { supabase } = await import('@/lib/supabaseClient');
          await supabase.auth.signOut();
          window.location.href = '/login';
        }}
        className="ml-auto rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white px-3.5 py-2 text-xs font-bold text-red-600 transition shadow-xs"
        title="Exit Admin Panel & Log Out"
      >
        🚪 Log Out
      </button>
    </div>
  );
}

