'use client';

type OrderPackingInfo = {
  id: string;
  created_at: string;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  artworks: {
    title: string;
    price: number;
    medium?: string | null;
  } | null;
};

export default function PackingSlipModal({
  order,
  artistName,
  onClose,
}: {
  order: OrderPackingInfo | null;
  artistName?: string;
  onClose: () => void;
}) {
  if (!order) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 text-black shadow-2xl print:shadow-none print:border-none print:w-full print:max-w-none print:p-0">
        {/* Screen Action Bar (hidden when printing) */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Official Art Dispatch Label & Packing Slip</h2>
            <p className="text-xs text-gray-500">Print and attach to the parcel or enclose inside</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-dark"
            >
              <span>🖨️</span> Print Label
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Section */}
        <div className="printable-content border-2 border-dashed border-gray-400 p-6 rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4">
            <div>
              <h1 className="font-serif text-2xl font-black tracking-wider text-gray-900">ARTELIO ATELIER</h1>
              <p className="text-xs uppercase tracking-widest text-gray-500">Fine Art Logistics & Authenticated Dispatch</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded border border-gray-900 px-2 py-0.5 font-mono text-xs font-bold uppercase">
                Original Artwork
              </span>
              <p className="mt-1 text-[11px] font-mono text-gray-600">ORDER #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-[11px] text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Sender & Recipient Grid */}
          <div className="mt-6 grid grid-cols-2 gap-6 border-b border-gray-200 pb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">DISPATCHED FROM (ARTIST)</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{artistName || 'Artelio Studio Creator'}</p>
              <p className="text-xs text-gray-600">Verified Independent Atelier</p>
              <p className="text-xs text-gray-600">via Artelio Fine Art Marketplace</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">DELIVER TO (RECIPIENT)</p>
              <p className="mt-1 text-base font-bold text-gray-900">{order.shipping_name || 'Art Collector'}</p>
              <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                {order.shipping_address}<br />
                {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
              </p>
              {order.shipping_phone && (
                <p className="mt-2 text-xs font-semibold text-gray-900">
                  Phone: <span className="font-mono">{order.shipping_phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Artwork Itemized */}
          <div className="mt-6 border-b border-gray-200 pb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">MANIFEST CONTENTS</p>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div>
                <p className="font-serif text-sm font-bold text-gray-900">{order.artworks?.title || 'Fine Art Original'}</p>
                <p className="text-xs text-gray-500">{order.artworks?.medium || 'Original Medium'} · Authentic 1-of-1 Piece</p>
              </div>
              <p className="font-mono text-sm font-bold text-gray-900">
                ₹{order.artworks?.price.toLocaleString('en-IN')} (PAID)
              </p>
            </div>
          </div>

          {/* Courier Warning Badge */}
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-xs text-amber-900">
              <p className="font-bold uppercase tracking-wide">CAUTION: ORIGINAL FINE ART INSIDE</p>
              <p className="text-[11px] text-amber-800">
                Fragile canvas/panel. Keep dry. Do not bend or place heavy parcels on top. Handle with extreme care.
              </p>
            </div>
          </div>

          {/* Footer Sign-off */}
          <div className="mt-6 flex items-center justify-between text-[11px] text-gray-400">
            <p>Protected by Artelio Escrow & Authenticity Standards</p>
            <p>support@artelio.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
