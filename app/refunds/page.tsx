import Link from 'next/link';

export const metadata = {
  title: 'Refund & Return Policy • Artelio Marketplace',
  description: 'Collector satisfaction guarantee, transit damage claims, and refund policies.',
};

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      {/* Lawyer Review Warning Banner */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3.5 text-xs sm:text-sm font-semibold text-amber-300 shadow-sm backdrop-blur-md">
        <span className="text-base">⚠️</span>
        <span>Draft: to be reviewed by a lawyer before launch.</span>
      </div>

      <div className="mb-8 border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-semibold text-[#4392F9] hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Refund &amp; Return Policy</h1>
        <p className="mt-2 text-xs text-white/50">Protected by Artelio Escrow Guarantee • Updated October 2026</p>
      </div>

      {/* Legal Entity & Notice Information Box */}
      <div className="mb-8 rounded-2xl border border-white/15 bg-[#121826] p-6 text-xs text-white/70 space-y-2">
        <h3 className="font-semibold text-sm text-white">Legal Entity &amp; Returns Help Desk:</h3>
        <p><strong className="text-white">Company Name:</strong> [Company Name: Artelio Atelier Private Limited / Enter Legal Entity Name]</p>
        <p><strong className="text-white">Returns Hub Address:</strong> [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India / Enter Registered Address]</p>
        <p><strong className="text-white">Support &amp; Claims Email:</strong> [Contact Email: support@artelio.in / Enter Support Contact Email]</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>🛡️</span> 48-Hour Inspection Window
          </h2>
          <p>
            Because collector funds are secured in platform escrow, the artist is not paid until you receive your piece. You have <strong className="text-white">48 hours from verified delivery</strong> to inspect the artwork in person.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Transit Damage or Material Discrepancy</h2>
          <p>
            If a painting, panel, or sculpture arrives damaged due to transit handling, or differs materially from its gallery photographs:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Take 2–3 clear photographs of the packaging and damage.</li>
            <li>Visit your <Link href="/orders" className="text-[#4392F9] font-semibold hover:underline">My Orders</Link> dashboard and click <strong>&ldquo;Report a Problem&rdquo;</strong> within 48 hours.</li>
            <li>Escrow payout is frozen immediately. If approved, a 100% refund is credited back to your original payment method.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Order Cancellations</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Prior to Dispatch:</strong> You may cancel an order free of penalty anytime before the artist marks the piece as shipped.
            </li>
            <li>
              <strong className="text-white">Post-Dispatch:</strong> Once custom fine-art crating is booked with the courier, cancellation is not possible until delivery inspection.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. Digital Artworks</h2>
          <p>
            Due to the immediate delivery of high-resolution master image files, digital artworks cannot be refunded once downloaded, except in cases of technical file corruption verified by platform administrators.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Claims &amp; Inquiries</h2>
          <p>
            For any dispute inquiries, contact our resolution desk:
          </p>
          <p className="mt-2 text-white/90">
            <strong>[Company Name: Artelio Atelier Private Limited]</strong><br />
            Address: [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India]<br />
            Email: <a href="mailto:[Contact Email: support@artelio.in]" className="text-[#4392F9] underline">[Contact Email: support@artelio.in]</a>
          </p>
        </section>
      </div>
    </main>
  );
}
