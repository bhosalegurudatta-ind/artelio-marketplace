import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function Footer() {
  const linkClass =
    'text-xs text-[#626262] hover:text-[#F83758] transition-colors duration-150 leading-relaxed';

  return (
    <footer className="mt-16 bg-white border-t border-[#E8E8E8] text-[#17223B]">
      {/* 1. Top Red/Coral Accent Strip */}
      <div className="h-1 w-full bg-[#F83758]" />

      {/* 2. Trust Assurance Badges (Matching Figma Flow) */}
      <div className="border-b border-[#E8E8E8] bg-[#F9F9F9] py-5">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-2xl">✨</span>
            <h4 className="text-xs font-bold text-[#17223B] mt-1">100% Authentic Products</h4>
            <p className="text-[11px] text-[#626262]">Original works direct from artist studios</p>
          </div>
          <div>
            <span className="text-2xl">🚚</span>
            <h4 className="text-xs font-bold text-[#17223B] mt-1">Free Insured Delivery</h4>
            <p className="text-[11px] text-[#626262]">Across all states in India with live tracking</p>
          </div>
          <div>
            <span className="text-2xl">📜</span>
            <h4 className="text-xs font-bold text-[#17223B] mt-1">Physical Signed COA</h4>
            <p className="text-[11px] text-[#626262]">Certificate of Authenticity with every piece</p>
          </div>
          <div>
            <span className="text-2xl">🔒</span>
            <h4 className="text-xs font-bold text-[#17223B] mt-1">Secure Razorpay Escrow</h4>
            <p className="text-[11px] text-[#626262]">Funds released after safe buyer delivery</p>
          </div>
        </div>
      </div>

      {/* 3. Main Directory Links */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#4392F9] to-[#F83758] flex items-center justify-center p-0.5">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#F83758]" />
              </div>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#4392F9] font-sans">
              <span className="text-[#4392F9]">Art</span>
              <span className="text-[#F83758]">elio</span>
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-xs text-[#626262] leading-relaxed">
            India’s daily fine art &amp; creative lifestyle marketplace. Discover, try in 3D, and collect original pieces directly from verified creator ateliers.
          </p>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-[#17223B]">100% Safe Payments:</span>
            <span className="text-[10px] bg-[#F3F3F3] text-[#17223B] font-bold px-2 py-0.5 rounded">UPI</span>
            <span className="text-[10px] bg-[#F3F3F3] text-[#17223B] font-bold px-2 py-0.5 rounded">GPay</span>
            <span className="text-[10px] bg-[#F3F3F3] text-[#17223B] font-bold px-2 py-0.5 rounded">PhonePe</span>
            <span className="text-[10px] bg-[#F3F3F3] text-[#17223B] font-bold px-2 py-0.5 rounded">Cards</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17223B] mb-3">
            Shop by Category
          </h4>
          <ul className="space-y-1.5">
            {CATEGORIES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link href={`/browse?category=${c.slug}`} className={linkClass}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17223B] mb-3">
            Collector Hub
          </h4>
          <ul className="space-y-1.5">
            <li><Link href="/browse" className={linkClass}>All Featured Products</Link></li>
            <li><Link href="/spaces" className={linkClass}>3D Room Visualizer</Link></li>
            <li><Link href="/track" className={linkClass}>Track My Delivery</Link></li>
            <li><Link href="/contact" className={linkClass}>Art Concierge Help</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17223B] mb-3">
            Seller &amp; Policy
          </h4>
          <ul className="space-y-1.5">
            <li>
              <Link href="/artist-signup" className="text-xs font-bold text-[#F83758] hover:underline">
                Sell on Artelio →
              </Link>
            </li>
            <li><Link href="/shipping-policy" className={linkClass}>Shipping &amp; Delivery</Link></li>
            <li><Link href="/refund-policy" className={linkClass}>Refund &amp; Return Policy</Link></li>
            <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* 4. Bottom Strip */}
      <div className="border-t border-[#E8E8E8] py-4 bg-[#F9F9F9] text-center text-xs text-[#626262]">
        <div className="mx-auto max-w-[1240px] px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Artelio Marketplace. Designed for daily art &amp; creative living.</p>
          <p className="text-[11px] text-[#A8A8A9]">Certified Products • Verified Artists • Escrow Protection</p>
        </div>
      </div>
    </footer>
  );
}
