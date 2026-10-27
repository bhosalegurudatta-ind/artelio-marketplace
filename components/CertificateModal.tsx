'use client';

type CertificateData = {
  orderId: string;
  orderDate?: string;
  artworkTitle: string;
  artistName: string;
  medium?: string | null;
  dimensions?: string | null;
  editionType?: string | null;
  isDigital?: boolean;
  collectorName?: string | null;
  imageUrl?: string | null;
};

export default function CertificateModal({
  data,
  onClose,
}: {
  data: CertificateData | null;
  onClose: () => void;
}) {
  if (!data) return null;

  const certificateNumber = `COA-ART-${data.orderId.slice(0, 8).toUpperCase()}-${(data.artworkTitle || 'ART').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;
  const issueDate = data.orderDate
    ? new Date(data.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md print:bg-white print:p-0 print:block">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0f141f] border border-white/10 p-6 md:p-8 text-white shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:p-0 print:overflow-visible">
        {/* Screen Action Bar (hidden when printing) */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="text-base font-bold text-white">Certificate of Authenticity (COA)</h2>
              <p className="text-xs text-white/60">Official archival provenance document for fine art collectors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow hover:bg-brand-dark transition-colors"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Certificate Parchment Document */}
        <div className="relative rounded-xl border-4 border-double border-amber-600/40 bg-[#fdfbf7] p-8 md:p-12 text-[#1a1815] shadow-inner print:border-4 print:border-amber-700/60 print:bg-white print:p-8">
          {/* Subtle Watermark Background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] select-none">
            <span className="font-serif text-[120px] font-black tracking-widest text-[#1a1815]">
              ARTELIO
            </span>
          </div>

          {/* Certificate Header */}
          <div className="text-center border-b-2 border-amber-900/20 pb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-px w-8 bg-amber-800/40"></span>
              <span className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-amber-900">
                Atelier Fine Art Registry
              </span>
              <span className="h-px w-8 bg-amber-800/40"></span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-wider text-[#1a1815]">
              CERTIFICATE OF AUTHENTICITY
            </h1>
            <p className="mt-2 text-xs text-[#5a544c] max-w-lg mx-auto font-serif italic">
              This official document certifies that the artwork described herein is an authentic, original creation registered on the Artelio Fine Art Marketplace.
            </p>
            <div className="mt-3 inline-block rounded border border-amber-900/30 bg-amber-50 px-3 py-1 font-mono text-xs font-bold text-amber-950">
              REGISTRATION NO: {certificateNumber}
            </div>
          </div>

          {/* Artwork Specs Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b-2 border-amber-900/20 pb-8">
            {/* Artwork Thumbnail (if available) */}
            <div className="flex flex-col items-center justify-center text-center">
              {data.imageUrl ? (
                <div className="relative h-44 w-44 overflow-hidden rounded-lg border-2 border-amber-900/30 shadow-md bg-white p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.imageUrl}
                    alt={data.artworkTitle}
                    className="h-full w-full object-cover rounded"
                  />
                </div>
              ) : (
                <div className="h-44 w-44 rounded-lg border-2 border-dashed border-amber-900/30 flex items-center justify-center text-amber-900/40 font-serif italic text-xs p-4 text-center">
                  Official Artelio Curatorial Seal
                </div>
              )}
              <span className="mt-2 text-[10px] uppercase font-mono tracking-wider text-[#7a7266]">
                Registered Visual Record
              </span>
            </div>

            {/* Artwork Details */}
            <div className="md:col-span-2 space-y-3.5 text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                  Artwork Title
                </span>
                <p className="font-serif text-xl font-bold text-[#1a1815]">
                  {data.artworkTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                    Artist / Creator
                  </span>
                  <p className="font-semibold text-[#1a1815]">{data.artistName}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                    Medium
                  </span>
                  <p className="text-[#3a352e]">{data.medium || (data.isDigital ? 'Digital Archival Edition' : 'Fine Art Original')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                    Edition Classification
                  </span>
                  <p className="font-medium text-[#1a1815]">
                    {data.editionType || (data.isDigital ? 'Certified Digital Download' : '1 of 1 Unique Original')}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                    Dimensions / Format
                  </span>
                  <p className="text-[#3a352e]">{data.dimensions || 'Archival Studio Dimensions'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7a7266] block">
                  Acquired By (Original Collector)
                </span>
                <p className="font-medium text-[#1a1815]">
                  {data.collectorName || 'Private Fine Art Collector'}
                </p>
              </div>
            </div>
          </div>

          {/* Legal / Provenance Declaration */}
          <div className="mt-6 text-xs text-[#5a544c] leading-relaxed">
            <p>
              <strong>Curatorial Provenance Guarantee:</strong> Artelio guarantees that this work has been verified against digital duplicate hashes and cataloged directly under the artist's certified studio profile. The artist retains moral copyright, and the registered collector holds physical ownership and primary provenance rights.
            </p>
          </div>

          {/* Signatures & Seal Section */}
          <div className="mt-10 grid grid-cols-3 gap-6 items-end pt-4">
            {/* Artist Signature Line */}
            <div className="text-center">
              <div className="h-10 border-b border-dashed border-amber-900/60 flex items-end justify-center pb-1">
                <span className="font-serif italic text-base text-[#1a1815]">{data.artistName}</span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7a7266]">
                Artist Signature
              </p>
            </div>

            {/* Official Artelio Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-double border-amber-700 bg-amber-100 text-amber-900 shadow-md">
                <div className="text-center">
                  <div className="text-xs font-serif font-black tracking-tighter">ARTELIO</div>
                  <div className="text-[8px] uppercase tracking-widest font-mono">SEAL</div>
                </div>
              </div>
              <span className="mt-1 text-[9px] uppercase font-mono tracking-wider text-amber-900/80">
                Verified Archival
              </span>
            </div>

            {/* Registrar Signature Line */}
            <div className="text-center">
              <div className="h-10 border-b border-dashed border-amber-900/60 flex items-end justify-center pb-1">
                <span className="font-serif italic text-xs text-[#4a443c]">Artelio Curatorial Registrar</span>
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7a7266]">
                Date: {issueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Footer print helper notice */}
        <p className="mt-4 text-center text-xs text-white/40 print:hidden">
          💡 Tip: Use your browser print dialog to print or select &quot;Save as PDF&quot; to keep an archival digital copy.
        </p>
      </div>
    </div>
  );
}
