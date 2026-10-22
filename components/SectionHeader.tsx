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
        <h2 className="relative font-serif text-3xl font-medium tracking-tight text-ink md:text-5xl flex items-baseline gap-2.5 flex-wrap">
          <span>{before}</span>
          <span className="art-gradient-text italic font-normal">
            {highlight}
          </span>
        </h2>
        {/* Subtle artistic spectrum micro-bar under the active section title */}
        <div className="mt-2.5 h-[2px] w-14 rounded-full art-spectrum-line" />
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/80 hover:bg-white px-4 py-1.5 art-tag text-[10px] text-ink/75 hover:border-brand/40 hover:text-brand hover:shadow-sm transition"
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
