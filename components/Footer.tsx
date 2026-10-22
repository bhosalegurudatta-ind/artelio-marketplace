import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  const linkClass =
    'flex items-center gap-1.5 text-sm text-white/70 hover:text-amber-300 transition-colors duration-200';

  return (
    <footer className="mt-28 bg-[#0D131F] text-white relative">
      {/* Radiant artistic spectrum accent top line */}
      <div className="h-[3px] w-full art-spectrum-line" />

      {/* Top section */}
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 pt-16 pb-12 md:grid-cols-12">
        {/* Brand column */}
        <div className="md:col-span-4">
          <div className="flex items-center gap-2">
            <p className="font-serif text-3xl font-black tracking-tight text-white">Artelio</p>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              Atelier
            </span>
          </div>
          <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-white/65 font-light">
            An online fine art marketplace where collectors discover authentic originals directly from independent painters, illustrators, and sculptors.
          </p>
          {/* Social / tag line */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-3 text-[11px] font-bold text-rose-300 tracking-wide">
              🎨 2,000+ Artworks
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 text-[11px] font-bold text-amber-300 tracking-wide">
              ✦ Direct from Artists
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-purple-400/30 bg-purple-500/10 px-3 text-[11px] font-bold text-purple-300 tracking-wide">
              🔮 Spatial AI 4K
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="md:col-span-4">
          <h3 className="text-xs font-bold tracking-widest text-amber-300/80 uppercase mb-4 flex items-center gap-2">
            <span>🖌️</span> Mediums &amp; Categories
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
          <h3 className="text-xs font-bold tracking-widest text-purple-300/80 uppercase mb-4 flex items-center gap-2">
            <span>✨</span> Collectors
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/browse" className={linkClass}><span className="text-white/30 text-xs">→</span>Browse all</Link></li>
            <li><Link href="/spaces" className={linkClass}><span className="text-white/30 text-xs">→</span>My Spaces</Link></li>
            <li><Link href="/customer-signup" className={linkClass}><span className="text-white/30 text-xs">→</span>Join Artelio</Link></li>
            <li><Link href="/orders" className={linkClass}><span className="text-white/30 text-xs">→</span>Track orders</Link></li>
            <li><Link href="/plans" className={linkClass}><span className="text-white/30 text-xs">→</span>Collector Club</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-xs font-bold tracking-widest text-rose-300/80 uppercase mb-4 flex items-center gap-2">
            <span>🎨</span> Artists
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/artist-signup" className={linkClass}><span className="text-white/30 text-xs">→</span>Sell your art</Link></li>
            <li><Link href="/dashboard" className={linkClass}><span className="text-white/30 text-xs">→</span>Artist Studio</Link></li>
            <li><Link href="/dashboard/upload" className={linkClass}><span className="text-white/30 text-xs">→</span>Upload piece</Link></li>
            <li><Link href="/plans" className={linkClass}><span className="text-white/30 text-xs">→</span>Creator Pro</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-xs text-white/45">
            © 2026 Artelio Marketplace. Hand-crafted original art directly from independent masters.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/50">
            <Link href="/login" className="hover:text-amber-300 transition-colors">Log in</Link>
            <span className="text-white/20">·</span>
            <Link href="/artist-signup" className="hover:text-amber-300 transition-colors">Become an artist</Link>
            <span className="text-white/20">·</span>
            <span className="text-rose-400 font-medium">Made with ♥ for Art in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
