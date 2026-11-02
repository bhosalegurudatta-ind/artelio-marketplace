import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  const linkClass =
    'text-xs text-gray-500 hover:text-[#FC2779] transition-colors duration-150 leading-relaxed';

  return (
    <footer className="mt-20 bg-white border-t border-[#E8E8E8] text-[#1A1A1A]">
      {/* 1. Nykaa Pink Top Accent Line */}
      <div className="h-1 w-full bg-[#FC2779]" />

      {/* 2. Top Trust Pillars (Nykaa style) */}
      <div className="border-b border-[#E8E8E8] bg-[#FAFAFA] py-6">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-2xl">✨</span>
            <h4 className="text-xs font-bold text-[#1A1A1A] mt-1">100% Genuine Artworks</h4>
            <p className="text-[11px] text-gray-500">Sourced directly from certified artists</p>
          </div>
          <div>
            <span className="text-2xl">🚚</span>
            <h4 className="text-xs font-bold text-[#1A1A1A] mt-1">Insured Courier Delivery</h4>
            <p className="text-[11px] text-gray-500">Free delivery on original paintings across India</p>
          </div>
          <div>
            <span className="text-2xl">📜</span>
            <h4 className="text-xs font-bold text-[#1A1A1A] mt-1">Authenticity Guaranteed</h4>
            <p className="text-[11px] text-gray-500">Every piece comes with a signed physical COA</p>
          </div>
          <div>
            <span className="text-2xl">🔒</span>
            <h4 className="text-xs font-bold text-[#1A1A1A] mt-1">Secure Razorpay Escrow</h4>
            <p className="text-[11px] text-gray-500">Safe payments with UPI, Cards &amp; NetBanking</p>
          </div>
        </div>
      </div>

      {/* 3. Main Footer Links */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-extrabold text-2xl tracking-tighter text-[#1A1A1A] font-sans">
              ARTELIO
            </span>
            <span className="text-[9px] font-extrabold tracking-widest text-[#FC2779] bg-[#FFF0F5] px-1.5 py-0.5 rounded uppercase border border-[#FC2779]/20">
              LUXE
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-xs text-gray-500 leading-relaxed">
            Artelio is India’s premier online curated fine art marketplace, connecting passionate art collectors with independent painters, sculptors, and digital creators across India.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs font-bold text-[#1A1A1A]">Payment Partners:</span>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded">UPI</span>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded">GPay</span>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded">PhonePe</span>
            <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded">Visa/Mastercard</span>
          </div>
        </div>

        {/* Mediums */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
            Art Categories
          </h4>
          <ul className="space-y-2">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link href={`/browse?category=${c.slug}`} className={linkClass}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Collector Corner */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
            Collector Services
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/browse" className={linkClass}>All Galleries</Link>
            </li>
            <li>
              <Link href="/spaces" className={linkClass}>3D Room Studio</Link>
            </li>
            <li>
              <Link href="/track" className={linkClass}>Track Delivery</Link>
            </li>
            <li>
              <Link href="/plans" className={linkClass}>VIP Patron Membership</Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>Art Concierge &amp; Advisory</Link>
            </li>
          </ul>
        </div>

        {/* Policies & Legal */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
            Help &amp; Legal
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/shipping-policy" className={linkClass}>Shipping &amp; Courier Policy</Link>
            </li>
            <li>
              <Link href="/refund-policy" className={linkClass}>Refund &amp; Return Policy</Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link>
            </li>
            <li>
              <Link href="/artist-signup" className="text-xs font-bold text-[#FC2779] hover:underline">
                Sell Art on Artelio →
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Bottom Copyright Strip */}
      <div className="border-t border-[#E8E8E8] py-4 bg-[#F7F7F7] text-center text-xs text-gray-500">
        <div className="mx-auto max-w-[1280px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Artelio Fine Arts India Pvt. Ltd. All rights reserved.</p>
          <p className="text-[11px] text-gray-400">Authentic Art • Verified Artist Ateliers • Escrow Protected</p>
        </div>
      </div>
    </footer>
  );
}
