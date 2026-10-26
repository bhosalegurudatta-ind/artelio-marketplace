import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy • Artelio Marketplace',
  description: 'How Artelio handles and protects your personal data and payments.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 text-white">
      <div className="border-b border-white/10 pb-6 mb-8">
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          ← Back to Artelio
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-xs text-white/50">Your Privacy &amp; Data Security • Updated October 2026</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-white/80 font-light">
        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">1. Information We Collect</h2>
          <p>
            When you create an account, list art, or acquire an artwork on Artelio, we collect only the necessary details required for authentication and physical fulfillment:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-white">Account Details:</strong> Name, Email Address, and role (Artist or Collector).</li>
            <li><strong className="text-white">Shipping Details:</strong> Recipient Name, Delivery Address, City, State, PIN Code, and Contact Phone (strictly shared with the delivering courier).</li>
            <li><strong className="text-white">Artist Banking Data:</strong> UPI ID or Bank Account &amp; IFSC (encrypted, used strictly for transferring sales revenue).</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">2. Payment Security &amp; Tokenization</h2>
          <p>
            Artelio operates a zero-storage policy regarding sensitive financial data. All payments are processed directly through <strong className="text-white">Razorpay</strong>, an RBI-authorized and PCI-DSS Level 1 compliant payment gateway. Artelio servers <strong className="text-white">never</strong> see, receive, or store your credit card numbers, CVV codes, or UPI PINs.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">3. How Your Data Is Used</h2>
          <p>Your personal information is used exclusively to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Generate printable dispatch packing slips and courier labels for delivery.</li>
            <li>Send transactional receipts, tracking updates, and delivery alerts.</li>
            <li>Facilitate artist payouts and tax invoicing.</li>
          </ul>
          <p className="mt-2 font-semibold text-malachite">
            ✓ We never sell, rent, or trade your personal information to third-party advertisers.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-6 space-y-3">
          <h2 className="font-serif text-xl font-bold text-white">4. Data Retention &amp; Rights</h2>
          <p>
            You have the right to request access to your stored personal data or request deletion of your account at any time by contacting our privacy team at <a href="mailto:privacy@artelio.com" className="text-brand hover:underline font-medium">privacy@artelio.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
