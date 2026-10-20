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
    <div className="mb-6 flex items-end justify-between border-b border-black/[0.08] pb-3.5">
      <h2 className="relative font-serif text-2xl font-bold tracking-tight text-ink md:text-3xl">
        {before} <span className="italic font-normal text-brand">{highlight}</span>
      </h2>
      {href && (
        <Link href={href} className="group flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-ink/60 hover:text-brand transition">
          <span>{linkLabel}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
