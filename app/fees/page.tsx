import Link from 'next/link';

export const metadata = {
  title: 'Pricing & Fee Schedule • Artelio Marketplace',
  description: 'Transparent commission rates, escrow protection release schedules, and artist subscription plans.',
};

export default function FeesPage() {
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
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Pricing &amp; Fee Schedule</h1>
        <p className="mt-2 text-xs text-white/50">Fair, Transparent, Creator-First Economics &bull; Effective October 2026</p>
      </div>

      {/* Legal Entity & Notice Information Box */}
      <div className="mb-8 rounded-2xl border border-white/15 bg-[#121826] p-6 text-xs text-white/70 space-y-2">
        <h3 className="font-semibold text-sm text-white">Merchant of Record &amp; Billing Inquiries:</h3>
        <p><strong className="text-white">Billing Entity:</strong> [Company Name: Artelio Atelier Private Limited / Enter Legal Entity Name]</p>
        <p><strong className="text-white">Billing Address:</strong> [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India / Enter Registered Address]</p>
        <p><strong className="text-white">Finance &amp; Payout Inquiries:</strong> [Contact Email: finance@artelio.in / Enter Finance Contact Email]</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        {/* Highlight Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#F83758]/40 bg-[#F83758]/10 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F83758]">Commission</span>
            <h3 className="mt-1 font-serif text-3xl font-bold text-white">10%</h3>
            <p className="mt-2 text-xs text-white/70">
              Only on completed sales. Artists take home <strong>90%</strong> of every artwork price with zero hidden transaction deductions.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Creator Membership</span>
            <h3 className="mt-1 font-serif text-3xl font-bold text-white">
              ₹499 <span className="text-sm font-sans font-normal text-white/60">/ month</span>
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Includes a <strong>30-day free trial</strong> upon curator approval. Zero listing fees for all uploaded physical and digital editions.
            </p>
          </div>
        </div>

        {/* 1. Commission Breakdown */}
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Marketplace Commission (10%)</h2>
          <p>
            Traditional art galleries charge 40% to 60% in gallery commission. At [Company Name: Artelio Atelier Private Limited], we charge a simple <strong>10% marketplace commission</strong> when an artwork sells.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Artist Net Earning:</strong> 90% of the listed price is settled directly to your registered bank account or UPI ID.</li>
            <li><strong>Included in the 10%:</strong> Payment processing gateway fees, fraud protection, digital Certificates of Authenticity, and round-the-clock collector customer support.</li>
          </ul>
        </section>

        {/* 2. Escrow Protection & Settlement Schedule */}
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Escrow Payout Schedule</h2>
          <p>
            To protect both collectors and artists from fraud, buyer payment is safely held in escrow until fulfillment is complete:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>🖼️</span> Original Physical Artworks
              </h3>
              <p className="text-xs text-white/70">
                Payment is held in escrow until:
              </p>
              <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                <li>The buyer confirms receipt in their portal, <strong>OR</strong></li>
                <li><strong>10 days after shipping</strong> pass with no problem or damage reported.</li>
              </ul>
              <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✓ Auto-released upon buyer confirmation or day 10.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>⚡</span> Digital Artworks
              </h3>
              <p className="text-xs text-white/70">
                Payment is held in escrow until:
              </p>
              <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                <li><strong>7 days</strong> after purchase and master file download pass with no technical dispute.</li>
              </ul>
              <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                ✓ Auto-released on day 7 post-purchase.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Subscription & Free Trial */}
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. 30-Day Free Trial &amp; Studio Subscription</h2>
          <p>
            We believe creators should start selling without upfront costs:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>30-Day Free Trial:</strong> Once your artist profile is approved by our curation team, your account receives a complimentary 30-day trial with full access to upload unlimited artwork, generate Certificate of Authenticity PDFs, and access the 3D Room Visualizer.
            </li>
            <li>
              <strong>Rs. 499 per month after trial:</strong> After the 30-day free trial concludes, maintaining your active atelier storefront, portfolio showcase, and verified seller badge is billed at <strong>Rs. 499 per month</strong> (inclusive of GST).
            </li>
            <li>
              <strong>Cancel Anytime:</strong> You may cancel or pause your subscription at any time directly in your account dashboard.
            </li>
          </ul>
        </section>

        {/* 4. Billing Contact */}
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Billing Questions &amp; Support</h2>
          <p>
            If you have questions about payouts, invoices, or subscriptions, reach out to:
          </p>
          <p className="mt-2 text-white/90">
            <strong>[Company Name: Artelio Atelier Private Limited]</strong><br />
            Address: [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India]<br />
            Finance Desk: <a href="mailto:[Contact Email: finance@artelio.in]" className="text-[#4392F9] underline">[Contact Email: finance@artelio.in]</a>
          </p>
        </section>
      </div>
    </main>
  );
}
