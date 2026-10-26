import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service • Artelio Marketplace',
  description: 'Terms and conditions governing the Artelio Atelier fine art marketplace.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      <div className="border-b border-white/10 pb-6 mb-8">
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Terms of Service</h1>
        <p className="mt-2 text-xs text-white/50">Last updated: October 2026 • Effective immediately</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Platform Nature & Overview</h2>
          <p>
            Artelio (&ldquo;Artelio Atelier&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an authenticated fine art marketplace connecting independent artists (&ldquo;Creators&rdquo;) directly with art buyers and collectors (&ldquo;Buyers&rdquo;). Artelio facilitates showcase, escrow payment processing, order dispatch workflows, and verified provenance documentation.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Intellectual Property & Copyright</h2>
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
          <h2 className="font-serif text-xl font-bold text-white">3. Platform Commission & Escrow Payouts</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white">Fee Structure:</strong> Artelio charges a 10% platform facilitation fee on completed sales. The remaining 90% is settled directly to the Artist.
            </li>
            <li>
              <strong className="text-white">Escrow Protection:</strong> To safeguard both collector and creator, buyer funds are held securely in platform escrow upon checkout.
            </li>
            <li>
              <strong className="text-white">Settlement Timelines:</strong>
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li><em>Physical Artworks:</em> Payout is released immediately upon buyer delivery confirmation, or automatically 10 days post-dispatch if no dispute is lodged.</li>
                <li><em>Digital Artworks:</em> Payout is released 7 days post-purchase after master file access.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Artist Responsibilities & Authenticity</h2>
          <p>
            Every artist agrees that any work exhibited is their own genuine original creation. Artelio maintains strict zero-tolerance policies regarding counterfeit, plagiarism, or unauthorized reproductions. Listings found in violation are removed immediately, and offending seller accounts are permanently banned.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">5. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Maharashtra, India.
          </p>
        </section>
      </div>
    </main>
  );
}
