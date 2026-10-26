import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy • Artelio Marketplace',
  description: 'Collector satisfaction guarantee, transit damage claims, and cancellation policies.',
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      <div className="border-b border-white/10 pb-6 mb-8">
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-xs text-white/50">Protected by Artelio Escrow Guarantee • Updated October 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>🛡️</span> 48-Hour Collector Satisfaction Guarantee
          </h2>
          <p>
            We want every collector to feel 100% confident when acquiring fine art. Because payments are secured in escrow, the artist is not paid until you receive your parcel. You have <strong className="text-white">48 hours from verified courier delivery</strong> to inspect the artwork under your home lighting.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Transit Damage or Loss in Transit</h2>
          <p>
            If a painting, panel, or sculpture arrives damaged due to courier handling, we guarantee a full resolution:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Take 2–3 clear photographs of the outer packaging and the damaged artwork.</li>
            <li>Go to your <Link href="/orders" className="text-brand font-semibold hover:underline">Orders Portal</Link> and click <strong>&ldquo;Report a Problem&rdquo;</strong> within 48 hours of delivery.</li>
            <li>Our concierge freezes escrow immediately, arranges reverse pickup if needed, and issues a <strong className="text-white">100% refund</strong> to your original payment method (UPI / Bank / Card).</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Order Cancellations</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Before Dispatch:</strong> You may cancel an order free of penalty anytime before the artist marks the parcel as shipped. A full refund is processed within 2–4 business days.
            </li>
            <li>
              <strong className="text-white">After Dispatch:</strong> Once custom physical packaging is booked and in transit with the courier, cancellation is not possible until delivery and inspection.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. Digital Artworks</h2>
          <p>
            Due to the immediate delivery of un-watermarked high-resolution master files, digital artworks cannot be refunded once downloaded, except in cases of technical file corruption verified by our engineering team.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Refund Processing SLA</h2>
          <p>
            Once a refund is approved by our Concierge team, the funds are credited via Razorpay back to your original payment source (UPI, Credit/Debit Card, or NetBanking) within <strong className="text-white">3 to 5 business days</strong> depending on your banking provider.
          </p>
        </section>
      </div>
    </main>
  );
}
