'use client';

export default function PackagingGuideModal({
  onClose,
}: {
  onClose: () => void;
}) {
  function handlePrintLabels() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md print:bg-white print:p-0 print:block">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0f141f] border border-white/10 p-6 md:p-8 text-white shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:w-full print:max-w-none print:max-h-none print:p-0">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="text-lg font-bold text-white">Fine Art Packaging & Safe Dispatch Protocol</h2>
              <p className="text-xs text-white/60">Museum-standard guidelines to guarantee zero damage during transit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintLabels}
              className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-brand-dark transition-colors"
            >
              <span>🏷️</span> Print Fragile Labels
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* 5-Step Visual Protocol */}
        <div className="space-y-4 print:hidden">
          {/* Step 1 */}
          <div className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
              1
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Glassine Paper Barrier (Never Wrap Bubble Wrap Directly on Paint)</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                Wrap the artwork completely in acid-free <strong>glassine paper</strong> or archival parchment. Plastic bubble wrap placed directly on oil or acrylic can react with varnish and leave permanent dimple marks during warm humid weather.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
              2
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Rigid Corner Armor & Edge Protectors</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                Fit plastic or 4-ply folded cardboard <strong>corner protectors</strong> to all 4 corners of the stretched canvas or framed piece. Most transit damage occurs when parcels are dropped on corners.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
              3
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Dual Bubble Wrap Layer (Air Bubbles Facing Outwards)</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                Wrap with at least <strong>two full layers of bubble wrap</strong>. Seal all seams firmly with heavy-duty packing tape. The wrapped package should feel firmly cushioned like a pillow.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
              4
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Sandwich Boards or Heavy PVC Tube</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                • <strong>Stretched canvases:</strong> Sandwich between two stiff double-wall corrugated cardboard sheets before placing in outer box.<br />
                • <strong>Rolled works on canvas/paper:</strong> Roll face-outward with glassine paper, slide into heavy PVC or 3mm spiral mailing tube with endcaps securely taped.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 font-bold text-brand">
              5
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Enclose Certificate of Authenticity & Packing Slip</h3>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">
                Place the signed <strong>Certificate of Authenticity</strong> in an archival envelope inside the box. Attach the Artelio Dispatch Label on the outside, then seal all outer seams with water-activated or heavy vinyl shipping tape.
              </p>
            </div>
          </div>
        </div>

        {/* Printable Warning Labels Section */}
        <div className="mt-6 pt-6 border-t border-white/10 print:mt-0 print:pt-0 print:border-none">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Printable Fine Art Fragile Stickers</h3>
            <span className="text-xs text-white/50">Cut out and paste on all sides of outer box</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-4 border-dashed border-red-600 bg-red-50 p-6 text-center rounded-xl text-red-950">
              <span className="text-4xl block">⚠️ 🍷</span>
              <h4 className="font-black text-2xl uppercase tracking-wider text-red-700 mt-2">FRAGILE: ORIGINAL ARTWORK</h4>
              <p className="font-bold text-sm mt-1 uppercase text-red-900">HANDLE WITH EXTREME CARE</p>
              <p className="text-xs text-red-800 mt-1">DO NOT DROP • KEEP AWAY FROM MOISTURE & HEAT</p>
              <div className="mt-3 text-[10px] font-mono border-t border-red-300 pt-1 tracking-widest uppercase">
                ARTELIO ATELIER LOGISTICS
              </div>
            </div>

            <div className="border-4 border-dashed border-red-600 bg-red-50 p-6 text-center rounded-xl text-red-950">
              <span className="text-4xl block">⬆️ ⬆️</span>
              <h4 className="font-black text-2xl uppercase tracking-wider text-red-700 mt-2">THIS SIDE UP</h4>
              <p className="font-bold text-sm mt-1 uppercase text-red-900">DO NOT STACK HEAVY FREIGHT</p>
              <p className="text-xs text-red-800 mt-1">CONTAINS HIGH-VALUE CANVASED FINE ART</p>
              <div className="mt-3 text-[10px] font-mono border-t border-red-300 pt-1 tracking-widest uppercase">
                ARTELIO ATELIER LOGISTICS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
