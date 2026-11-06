import Link from 'next/link';

export const metadata = {
  title: 'Copyright & IP Policy • Artelio Marketplace',
  description: 'How to report copied work, intellectual property infringement, and counterfeit art on Artelio.',
};

export default function CopyrightPage() {
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
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Copyright &amp; IP Protection</h1>
        <p className="mt-2 text-xs text-white/50">Originality Protection &bull; How to Report Copied Work</p>
      </div>

      {/* Legal Entity & Notice Information Box */}
      <div className="mb-8 rounded-2xl border border-white/15 bg-[#121826] p-6 text-xs text-white/70 space-y-2">
        <h3 className="font-semibold text-sm text-white">Designated Copyright Agent &amp; Legal Notices:</h3>
        <p><strong className="text-white">Company Name:</strong> [Company Name: Artelio Atelier Private Limited / Enter Legal Entity Name]</p>
        <p><strong className="text-white">Registered Address:</strong> [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India / Enter Registered Address]</p>
        <p><strong className="text-white">Designated DMCA / Copyright Email:</strong> [Contact Email: legal@artelio.in / Enter Copyright Agent Email]</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>🛡️</span> Zero-Tolerance Policy for Stolen &amp; Copied Art
          </h2>
          <p>
            [Company Name: Artelio Atelier Private Limited] is committed to protecting the intellectual property of artists worldwide. Every artwork sold on our marketplace must be genuine, authorized, and created by the listed artist. We strictly prohibit unauthorized reproductions, counterfeits, and plagiarized works.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">How to Report a Copied Work</h2>
          <p>
            If you believe an artwork listed on Artelio infringes your copyright or moral rights, you can report it through either of two channels:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>⚡</span> Method 1: Quick On-Site Report
              </h3>
              <p className="text-xs text-white/70">
                1. Navigate to the artwork page.<br />
                2. Scroll down and click the <strong>&ldquo;Report this Listing&rdquo;</strong> button.<br />
                3. Select <em>&ldquo;Copyright or stolen art&rdquo;</em> and provide a link to the original work.<br />
                4. Our moderation council receives an immediate alert.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>✉️</span> Method 2: Formal Notice by Email
              </h3>
              <p className="text-xs text-white/70">
                Send a formal infringement notice to our Designated Copyright Agent at:
                <br />
                <a href="mailto:[Contact Email: legal@artelio.in]" className="text-[#4392F9] font-semibold underline block mt-1">
                  [Contact Email: legal@artelio.in]
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">Required Information for Copyright Notices</h2>
          <p>To help us take swift action, please include the following in your report:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Identification of the original artwork:</strong> High-resolution photos, creation date, portfolio link, or copyright registration number.</li>
            <li><strong>Identification of the disputed listing:</strong> The URL or Artwork ID on Artelio.</li>
            <li><strong>Contact details:</strong> Your full name, mailing address, telephone number, and email.</li>
            <li><strong>Good faith statement:</strong> A statement that you believe in good faith that the use of the material is not authorized by the copyright owner, its agent, or the law.</li>
            <li><strong>Accuracy statement:</strong> A statement under penalty of perjury that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">Our Action &amp; Takedown Procedure</h2>
          <p>Upon receiving a verified report:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>The reported listing is immediately taken down and hidden from public search, browse, and artist profiles.</li>
            <li>The uploader is notified and given an opportunity to present evidence of authorship or licensing.</li>
            <li>If the seller cannot prove authenticity, the listing is permanently deleted and their artist account is permanently suspended from the marketplace.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">Contact Our Legal Department</h2>
          <p>
            Send all formal intellectual property correspondence to:
          </p>
          <p className="mt-2 text-white/90">
            <strong>[Company Name: Artelio Atelier Private Limited]</strong><br />
            Attention: Designated Copyright Agent<br />
            Address: [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India]<br />
            Email: <a href="mailto:[Contact Email: legal@artelio.in]" className="text-[#4392F9] underline">[Contact Email: legal@artelio.in]</a>
          </p>
        </section>
      </div>
    </main>
  );
}
