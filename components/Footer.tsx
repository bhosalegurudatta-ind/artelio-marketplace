import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  const linkClass =
    'flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors duration-200';

  return (
    <footer className="mt-24 bg-[#0E1420] text-white">
      {/* Top section */}
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 pt-16 pb-12 md:grid-cols-12">
        {/* Brand column */}
        <div className="md:col-span-4">
          <p className="font-serif text-2xl font-bold tracking-tight">Artelio</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
            Original art, bought directly from the independent artists who made it. Every piece is unique.
          </p>
          {/* Social / tag line */}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full border border-white/15 px-3 text-[11px] font-medium text-white/50 tracking-wide">
              2,000+ Artworks
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-white/15 px-3 text-[11px] font-medium text-white/50 tracking-wide">
              Direct from Artists
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="md:col-span-4">
          <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-4">
            Browse by Medium
          </h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/browse?category=${c.slug}`} className={linkClass}>
                  <span className="text-white/30 text-xs">→</span>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div className="md:col-span-2">
          <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-4">
            Collectors
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/browse" className={linkClass}><span className="text-white/30 text-xs">→</span>Browse all</Link></li>
            <li><Link href="/customer-signup" className={linkClass}><span className="text-white/30 text-xs">→</span>Join Artelio</Link></li>
            <li><Link href="/orders" className={linkClass}><span className="text-white/30 text-xs">→</span>Your orders</Link></li>
            <li><Link href="/plans" className={linkClass}><span className="text-white/30 text-xs">→</span>Collector Club</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase mb-4">
            Artists
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/artist-signup" className={linkClass}><span className="text-white/30 text-xs">→</span>Sell your art</Link></li>
            <li><Link href="/dashboard" className={linkClass}><span className="text-white/30 text-xs">→</span>Dashboard</Link></li>
            <li><Link href="/dashboard/upload" className={linkClass}><span className="text-white/30 text-xs">→</span>Upload a piece</Link></li>
            <li><Link href="/plans" className={linkClass}><span className="text-white/30 text-xs">→</span>Creator Pro</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-[11px] text-white/35">
            © 2026 Artelio Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[11px] text-white/35">
            <Link href="/login" className="hover:text-white/60 transition-colors">Log in</Link>
            <span className="text-white/20">·</span>
            <Link href="/artist-signup" className="hover:text-white/60 transition-colors">Become an artist</Link>
            <span className="text-white/20">·</span>
            <span>Made with ♥ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
