import Link from 'next/link';

export const metadata = {
  title: 'Shipping & Delivery Policy • Artelio Marketplace',
  description: 'Packaging standards, courier partners, dispatch timelines, and transit insurance.',
};

export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      <div className="border-b border-white/10 pb-6 mb-8">
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Shipping &amp; Delivery Policy</h1>
        <p className="mt-2 text-xs text-white/50">Museum-Grade Packaging Standards • Updated October 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>📦</span> 1. Courier Partners &amp; Coverage
          </h2>
          <p>
            Artelio operates a nationwide courier network covering over 19,000 PIN codes across India through Tier-1 fine art capable logistics partners:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="font-bold text-xs text-white">Blue Dart</span>
              <p className="text-[10px] text-white/50 mt-1">Air Express</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="font-bold text-xs text-white">Delhivery</span>
              <p className="text-[10px] text-white/50 mt-1">Insured Surface & Air</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="font-bold text-xs text-white">DTDC</span>
              <p className="text-[10px] text-white/50 mt-1">Priority Cargo</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className="font-bold text-xs text-white">India Post</span>
              <p className="text-[10px] text-white/50 mt-1">Speed Post (All PINs)</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Dispatch &amp; Delivery Timelines</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Studio Preparation & Dispatch:</strong> Artists are required to inspect, sign, and securely package the artwork within <strong className="text-white">3 to 5 business days</strong> of order confirmation.
            </li>
            <li>
              <strong className="text-white">Transit Times:</strong>
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li><em>Metro Cities (Mumbai, Delhi-NCR, Bengaluru, Chennai, Kolkata, Hyderabad):</em> 2 to 4 business days post-dispatch.</li>
                <li><em>Rest of India:</em> 4 to 7 business days post-dispatch.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. Professional Fine Art Packaging Protocol</h2>
          <p>
            To prevent canvas sag, puncture, or humidity exposure, all physical original artworks are dispatched following Artelio packaging specifications:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 mt-2">
            <li><strong>Surface Protection:</strong> Acid-free glassine paper directly against painted surfaces to prevent pigment adhesion.</li>
            <li><strong>Moisture & Shock Barrier:</strong> Double-layered high-density bubble wrap sealed watertight.</li>
            <li><strong>Corner Armor:</strong> Heavy-duty cardboard or foam corner protectors fitted on stretched canvases.</li>
            <li><strong>Rigid Encapsulation:</strong> Custom corrugated double-wall box or heavy-duty PVC tube for rolled works, labeled &ldquo;FRAGILE — ORIGINAL ARTWORK&rdquo;.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Tracking Your Parcel</h2>
          <p>
            Once the artist dispatches the package, you receive an automated notification with the courier name and AWB Tracking ID. You can also view real-time tracking anytime via your <Link href="/orders" className="text-brand font-semibold hover:underline">Artelio Orders Portal</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
