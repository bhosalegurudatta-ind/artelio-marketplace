import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy • Artelio Marketplace',
  description: 'How Artelio handles and protects your personal data and transactions.',
};

export default function PrivacyPage() {
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
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-white/50">Your Privacy &amp; Data Security • Updated October 2026</p>
      </div>

      {/* Legal Entity & Notice Information Box */}
      <div className="mb-8 rounded-2xl border border-white/15 bg-[#121826] p-6 text-xs text-white/70 space-y-2">
        <h3 className="font-semibold text-sm text-white">Data Controller &amp; Notice Information:</h3>
        <p><strong className="text-white">Company Name:</strong> [Company Name: Artelio Atelier Private Limited / Enter Legal Entity Name]</p>
        <p><strong className="text-white">Registered Address:</strong> [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India / Enter Registered Address]</p>
        <p><strong className="text-white">Privacy Officer Email:</strong> [Contact Email: privacy@artelio.in / Enter Privacy Contact Email]</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Information We Collect</h2>
          <p>
            When you register, sell, or collect artwork on [Company Name: Artelio Atelier Private Limited], we collect information strictly necessary to fulfill marketplace transactions:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-white">Account Details:</strong> Name, Email Address, and role (Artist or Collector).</li>
            <li><strong className="text-white">Delivery Data:</strong> Recipient Name, Delivery Address, City, State, PIN Code, and Contact Phone (exclusively shared with shipping couriers).</li>
            <li><strong className="text-white">Artist Banking Data:</strong> Encrypted UPI ID or Bank Account Details used solely for issuing sales payouts.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Payment Security &amp; Tokenization</h2>
          <p>
            Artelio operates a strict zero-storage policy for payment card numbers, CVVs, or UPI PINs. All financial payments are tokenized directly via RBI-licensed, PCI-DSS Level 1 compliant gateway partners (Razorpay).
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. How Your Data Is Protected</h2>
          <p>
            We implement database-level Row Level Security (RLS) and end-to-end encryption. Your personal information is never sold, leased, or rented to third-party ad networks.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Contact &amp; Grievance Officer</h2>
          <p>
            For any data requests, deletion inquiries, or privacy questions, contact our Grievance Officer at:
          </p>
          <p className="mt-2 text-white/90">
            <strong>[Company Name: Artelio Atelier Private Limited]</strong><br />
            Address: [Registered Address: Plot No. XX, Art District, Bandra West, Mumbai, Maharashtra, 400050, India]<br />
            Email: <a href="mailto:[Contact Email: privacy@artelio.in]" className="text-[#4392F9] underline">[Contact Email: privacy@artelio.in]</a>
          </p>
        </section>
      </div>
    </main>
  );
}
