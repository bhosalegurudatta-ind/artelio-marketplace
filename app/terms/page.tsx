import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service • Artelio Marketplace',
  description: 'Terms and conditions governing the Artelio Atelier fine art marketplace.',
};

export default function TermsPage() {
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
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Terms of Service</h1>
        <p className="mt-2 text-xs text-white/50">Last updated: October 2026 • Legal Framework</p>
      </div>

      {/* Legal Entity & Notice Information Box */}
      <div className="mb-8 rounded-2xl border border-white/15 bg-[#121826] p-6 text-xs text-white/70 space-y-2">
        <h3 className="font-semibold text-sm text-white">Entity & Notice Information:</h3>
        <p><strong className="text-white">Legal Entity Name:</strong> [Company Name: Artelio Atelier Private Limited / Enter Legal Entity Name]</p>
        <p><strong className="text-white">Registered Office:</strong> [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India / Enter Registered Address]</p>
        <p><strong className="text-white">Legal Contact Email:</strong> [Contact Email: legal@artelio.in / Enter Legal Contact Email]</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Platform Nature & Overview</h2>
          <p>
            [Company Name: Artelio Atelier Private Limited] (&ldquo;Artelio&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an authenticated fine art marketplace connecting independent artists (&ldquo;Creators&rdquo;) directly with art buyers and collectors (&ldquo;Buyers&rdquo;). Artelio facilitates artwork exhibition, secure escrow payment handling, order dispatch workflows, and verified provenance documentation.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Intellectual Property & Originality</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Artist Ownership:</strong> The Artist retains 100% full moral and intellectual copyright to all original works exhibited on Artelio.
            </li>
            <li>
              <strong className="text-white">Buyer Rights:</strong> When a collector purchases an original physical artwork, they acquire physical title and ownership of the material artwork. The buyer does not acquire commercial copyright, reproduction rights, or merchandise rights unless explicitly assigned in writing by the artist.
            </li>
            <li>
              <strong className="text-white">Digital Editions:</strong> Buyers of digital artworks receive a personal, non-exclusive, non-transferable license to display the work on personal devices or private prints.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. Platform Fees & Escrow Protection</h2>
          <p>
            Artelio operates a transparent fee model detailed in full on our <Link href="/fees" className="text-[#F83758] underline font-semibold">Fees Schedule</Link>:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">10% Facilitation Fee:</strong> Artelio charges a 10% commission on completed sales, with 90% credited to the creator.
            </li>
            <li>
              <strong className="text-white">Escrow Safeguards:</strong> Buyer funds are safely held in escrow until delivery is confirmed by the buyer, or until 7 days (for digital works) or 10 days post-dispatch (for physical works) elapse without dispute.
            </li>
            <li>
              <strong className="text-white">Creator Subscription:</strong> All artists receive a 30-day free trial upon approval, followed by a flat Rs. 499/month membership to maintain an active studio shop.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Artist Responsibilities & Authenticity</h2>
          <p>
            Every artist certifies that any work exhibited is their own genuine original creation. Plagiarism, counterfeit items, or stolen works are strictly banned. If you suspect an artwork infringes your copyright, refer to our <Link href="/copyright" className="text-[#4392F9] underline font-semibold">Copyright Infringement Policy</Link> to report it immediately.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">5. Governing Law & Contact</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. For all legal notices, please write to:
          </p>
          <p className="mt-2 text-white/90">
            <strong>[Company Name: Artelio Atelier Private Limited]</strong><br />
            Address: [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India]<br />
            Email: <a href="mailto:[Contact Email: legal@artelio.in]" className="text-[#4392F9] underline">[Contact Email: legal@artelio.in]</a>
          </p>
        </section>
      </div>
    </main>
  );
}
