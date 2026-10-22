import Link from 'next/link';

export default function SectionHeader({
  before,
  highlight,
  href,
  linkLabel = 'View all',
}: {
  before: string;
  highlight: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between border-b border-black/[0.08] pb-4 relative">
      <div>
        <h2 className="relative font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl flex items-baseline gap-2 flex-wrap">
          <span>{before}</span>
          <span className="art-gradient-text italic font-bold">
            {highlight}
          </span>
        </h2>
        {/* Subtle artistic spectrum micro-bar under the active section title */}
        <div className="mt-2 h-[2px] w-12 rounded-full art-spectrum-line" />
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 hover:bg-white px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase text-ink/70 hover:border-brand/40 hover:text-brand hover:shadow-sm transition"
        >
          <span>{linkLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1" aria-hidden="true">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
