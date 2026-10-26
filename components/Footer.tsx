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
        <div className="md:col-span-3">
          <div className="flex items-center gap-2">
            <p className="font-serif text-3xl font-bold tracking-tight text-white">Artelio</p>
            <span className="art-tag text-[9px] text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Atelier
            </span>
          </div>
          <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-white/65 font-light">
            An online fine art marketplace where collectors discover authentic originals directly from independent painters, illustrators, and sculptors.
          </p>
          {/* Social / tag line */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-3 art-tag text-[10px] text-rose-300">
              🎨 2,000+ Artworks
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 art-tag text-[10px] text-amber-300">
              ✦ Direct from Artists
            </span>
            <span className="inline-flex h-7 items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 art-tag text-[10px] text-emerald-300">
              🛡️ Escrow Protected
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="md:col-span-3">
          <h3 className="art-kicker text-amber-300/80 mb-4 flex items-center gap-2">
            <span>🖌️</span> Mediums &amp; Categories
          </h3>
          <ul className="grid grid-cols-1 gap-y-2.5">
            {CATEGORIES.slice(0, 5).map((c) => (
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
          <h3 className="art-kicker text-purple-300/80 mb-4 flex items-center gap-2">
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
          <h3 className="art-kicker text-rose-300/80 mb-4 flex items-center gap-2">
            <span>🎨</span> Artists
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/artist-signup" className={linkClass}><span className="text-white/30 text-xs">→</span>Sell your art</Link></li>
            <li><Link href="/dashboard" className={linkClass}><span className="text-white/30 text-xs">→</span>Artist Studio</Link></li>
            <li><Link href="/dashboard/upload" className={linkClass}><span className="text-white/30 text-xs">→</span>Upload piece</Link></li>
            <li><Link href="/plans" className={linkClass}><span className="text-white/30 text-xs">→</span>Creator Pro</Link></li>
          </ul>
        </div>

        {/* Legal & Trust Policies (Mandatory for Razorpay & E-Commerce) */}
        <div className="md:col-span-2">
          <h3 className="art-kicker text-emerald-300/80 mb-4 flex items-center gap-2">
            <span>🛡️</span> Trust &amp; Legal
          </h3>
          <ul className="space-y-2.5">
            <li><Link href="/terms" className={linkClass}><span className="text-white/30 text-xs">→</span>Terms of Service</Link></li>
            <li><Link href="/refund-policy" className={linkClass}><span className="text-white/30 text-xs">→</span>Refund &amp; Returns</Link></li>
            <li><Link href="/shipping-policy" className={linkClass}><span className="text-white/30 text-xs">→</span>Shipping Policy</Link></li>
            <li><Link href="/privacy-policy" className={linkClass}><span className="text-white/30 text-xs">→</span>Privacy Policy</Link></li>
            <li><Link href="/contact" className={linkClass}><span className="text-white/30 text-xs">→</span>Contact &amp; Grievance</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-xs text-white/45">
            © 2026 Artelio Marketplace. Hand-crafted original art directly from independent masters.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
            <Link href="/terms" className="hover:text-amber-300 transition-colors">Terms</Link>
            <span className="text-white/20">·</span>
            <Link href="/refund-policy" className="hover:text-amber-300 transition-colors">Refunds</Link>
            <span className="text-white/20">·</span>
            <Link href="/shipping-policy" className="hover:text-amber-300 transition-colors">Shipping</Link>
            <span className="text-white/20">·</span>
            <Link href="/privacy-policy" className="hover:text-amber-300 transition-colors">Privacy</Link>
            <span className="text-white/20">·</span>
            <Link href="/contact" className="hover:text-amber-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
