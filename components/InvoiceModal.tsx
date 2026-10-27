'use client';

type InvoiceData = {
  orderId: string;
  orderDate: string;
  artworkTitle: string;
  artistName: string;
  price: number;
  medium?: string | null;
  isDigital?: boolean;
  buyerName?: string | null;
  buyerAddress?: string | null;
  buyerCity?: string | null;
  buyerState?: string | null;
  buyerPostalCode?: string | null;
  buyerPhone?: string | null;
  paymentId?: string | null;
};

export default function InvoiceModal({
  data,
  onClose,
}: {
  data: InvoiceData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const invoiceNumber = `INV-${data.orderId.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(data.orderDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const basePrice = Math.round((data.price / 1.18) * 100) / 100;
  const gstAmount = Math.round((data.price - basePrice) * 100) / 100;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md print:bg-white print:p-0 print:block">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0f141f] border border-white/10 p-6 md:p-8 text-white shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:p-0">
        {/* Screen Action Bar (hidden when printing) */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h2 className="text-base font-bold text-white">Acquisition Tax Invoice & Receipt</h2>
              <p className="text-xs text-white/60">Official fiscal proof of purchase for insurance & bookkeeping</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-dark transition-colors"
            >
              <span>🖨️</span> Print Invoice / PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Invoice Page */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-900 shadow-sm print:border-none print:p-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-300 pb-6">
            <div>
              <h1 className="font-serif text-3xl font-black tracking-tight text-gray-900">
                ARTELIO ATELIER
              </h1>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-mono mt-0.5">
                Fine Art Marketplace & Curatorial Platform
              </p>
              <p className="mt-2 text-xs text-gray-600 max-w-xs leading-relaxed">
                Registered Fine Art Atelier Network<br />
                Bangalore, Karnataka, India • contact@artelio.in<br />
                GSTIN: 29AAACA0000A1Z5 (Composition / Marketplace)
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block rounded bg-gray-900 px-3 py-1 font-mono text-xs font-bold uppercase text-white">
                Tax Invoice
              </span>
              <p className="mt-2 font-mono text-xs font-bold text-gray-800">
                INVOICE #: {invoiceNumber}
              </p>
              <p className="text-xs text-gray-600">Date: {invoiceDate}</p>
              <p className="mt-1 font-mono text-[11px] text-gray-500">
                Order Ref: #{data.orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Billing & Shipping Grid */}
          <div className="mt-6 grid grid-cols-2 gap-8 border-b border-gray-200 pb-6 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-gray-400 text-[10px] mb-1">
                Billed / Issued To (Collector)
              </p>
              <p className="font-bold text-sm text-gray-900">
                {data.buyerName || 'Private Fine Art Collector'}
              </p>
              {data.buyerAddress && (
                <p className="mt-1 text-gray-700 leading-relaxed">
                  {data.buyerAddress}<br />
                  {data.buyerCity}, {data.buyerState} {data.buyerPostalCode ? `- ${data.buyerPostalCode}` : ''}
                </p>
              )}
              {data.buyerPhone && (
                <p className="mt-1 text-gray-600 font-mono">Phone: {data.buyerPhone}</p>
              )}
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px] mb-1">
                Payment & Fulfillment
              </p>
              <p className="text-gray-700">
                Payment Gateway: <strong className="text-gray-900">Razorpay Encrypted (UPI / NetBanking / Cards)</strong>
              </p>
              <p className="text-gray-700 mt-1">
                Settlement Status: <strong className="text-emerald-700">✓ Paid in Full (Escrow Protected)</strong>
              </p>
              <p className="text-gray-700 mt-1">
                Fulfillment Mode: <strong>{data.isDigital ? 'Instant Lossless Digital Delivery' : 'Insured Door-to-Door Fine Art Courier'}</strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-50 font-bold uppercase tracking-wider text-[11px] text-gray-700">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Artist / Creator</th>
                  <th className="py-2.5 px-3 text-right">Base Amount</th>
                  <th className="py-2.5 px-3 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-3">
                    <p className="font-bold text-gray-900 text-sm">{data.artworkTitle}</p>
                    <p className="text-gray-500 text-[11px]">
                      {data.medium || (data.isDigital ? 'Digital Master Edition' : 'Fine Art Original')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Includes 100% Provenance Guarantee & Signed Certificate of Authenticity (COA)
                    </p>
                  </td>
                  <td className="py-4 px-3 font-medium text-gray-800">
                    {data.artistName}
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-gray-700">
                    ₹{basePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-3 text-right font-bold font-mono text-gray-900 text-sm">
                    ₹{data.price.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Net Artwork Subtotal:</span>
                <span className="font-mono">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Integrated GST (18% inclusive):</span>
                <span className="font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Insured Museum Packaging:</span>
                <span className="font-bold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-sm font-bold text-gray-900">
                <span>Total Paid:</span>
                <span className="font-serif text-lg">₹{data.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Legal / Escrow Guarantee Footer */}
          <div className="mt-10 border-t border-gray-200 pt-4 text-[10px] text-gray-500 leading-relaxed flex items-center justify-between">
            <div>
              <p>
                <strong>Terms:</strong> This computer-generated invoice is issued on behalf of the artist atelier. Physical shipments include our 48-Hour Unboxing Transit Guarantee.
              </p>
              <p className="mt-0.5">
                Questions or damage claims: support@artelio.in • https://artelio.in
              </p>
            </div>
            <div className="text-center shrink-0 ml-6">
              <div className="h-10 w-24 border-b border-dashed border-gray-400 flex items-end justify-center pb-0.5">
                <span className="font-serif italic text-xs text-gray-800">Artelio Atelier</span>
              </div>
              <p className="mt-0.5 text-[9px] uppercase font-bold text-gray-400">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
