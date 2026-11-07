'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CertificateModal from '@/components/CertificateModal';
import InvoiceModal from '@/components/InvoiceModal';

type Artwork = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  sold: boolean;
  is_digital: boolean;
  medium?: string | null;
  shipping_fee?: number | null;
  ships_from?: string | null;
};

type ShippingForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const params = useParams();
  const router = useRouter();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Real e-commerce confirmed order state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    paymentId: string;
    totalPaid: number;
    artwork: Artwork;
    shipping: ShippingForm;
    downloadUrl?: string | null;
  } | null>(null);

  const [coaData, setCoaData] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);

  const [shipping, setShipping] = useState<ShippingForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUserEmail(authData.user.email ?? null);
        // Prefill name & address if in user profile
        const { data: profile } = await supabase
          .from('users')
          .select('name, address')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile) {
          setShipping((prev) => ({
            ...prev,
            name: profile.name && profile.name !== 'Unnamed' ? profile.name : prev.name,
            address: profile.address || prev.address,
          }));
        }
      }

      let artData: any = null;
      const { data: artWithShipping, error: artErr } = await supabase
        .from('artworks')
        .select('id, title, price, image_url, sold, is_digital, medium, shipping_fee, ships_from')
        .eq('id', params.id)
        .maybeSingle();

      if (artErr || !artWithShipping) {
        const { data: fallbackArt } = await supabase
          .from('artworks')
          .select('id, title, price, image_url, sold, is_digital, medium')
          .eq('id', params.id)
          .single();
        artData = fallbackArt;
      } else {
        artData = artWithShipping;
      }

      setArtwork(artData);
      setLoading(false);
    }
    load();
  }, [params.id]);

  function validateShipping(): string | null {
    if (!artwork || artwork.is_digital) return null;
    if (!shipping.name.trim()) return 'Please enter the recipient full name.';
    if (!shipping.phone.trim() || shipping.phone.trim().length < 10) {
      return 'Please enter a valid 10-digit mobile number for courier delivery updates.';
    }
    if (!shipping.address.trim()) return 'Please enter the street delivery address.';
    if (!shipping.city.trim()) return 'Please enter the city.';
    if (!shipping.state.trim()) return 'Please enter the state.';
    if (!shipping.postalCode.trim() || shipping.postalCode.trim().length < 5) {
      return 'Please enter a valid postal / PIN code.';
    }
    return null;
  }

  async function handlePay() {
    if (!artwork) return;
    setErrorMsg('');

    // Validate shipping details for physical pieces
    const shippingError = validateShipping();
    if (shippingError) {
      setErrorMsg(shippingError);
      return;
    }

    setPaying(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setErrorMsg('Please log in or create an account before checking out.');
      setPaying(false);
      return;
    }
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 1. Create Razorpay order on server
    const orderRes = await fetch('/api/razorpay-order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ artworkId: artwork.id }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      setErrorMsg(orderData.error ?? 'Could not initialize payment.');
      setPaying(false);
      return;
    }

    // 2. Open Razorpay checkout modal
    const razorpayKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setErrorMsg('Razorpay payment gateway is not configured. Please contact support.');
      setPaying(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: razorpayKey,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Artelio Marketplace',
      description: artwork.title,
      order_id: orderData.orderId,
      prefill: {
        name: shipping.name,
        contact: shipping.phone,
        email: userEmail || undefined,
      },
      handler: async function (response: any) {
        // 3. Verify payment and save order with shipping details
        const verifyRes = await fetch('/api/razorpay-verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            shipping: artwork.is_digital ? null : shipping,
          }),
        });

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json().catch(() => ({}));
          setConfirmedOrder({
            orderId: verifyData.orderId || orderData.orderId,
            paymentId: response.razorpay_payment_id,
            totalPaid: totalAmount,
            artwork: artwork,
            shipping: shipping,
            downloadUrl: artwork.is_digital ? (artwork.image_url || null) : null,
          });
          setPaying(false);
        } else {
          const err = await verifyRes.json().catch(() => ({}));
          setErrorMsg(err.error ?? 'Payment was processed but verification failed. Please contact Artelio support.');
          setPaying(false);
        }
      },
      modal: { ondismiss: () => setPaying(false) },
      theme: { color: '#6366F1' },
    });

    razorpay.open();
  }

  if (confirmedOrder) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16 text-[#17223B]">
        {/* Real E-Commerce Order Confirmation Banner */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-stylish-card text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 shadow-sm animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <span className="inline-block rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 uppercase tracking-widest mb-2">
            ✓ Payment Verified &amp; Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#17223B]">
            Thank You for Your Order!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#626262]">
            Your payment of <strong className="text-[#17223B]">₹{confirmedOrder.totalPaid.toLocaleString('en-IN')}</strong> was captured successfully via Razorpay.
          </p>

          {/* Transaction Metadata Card */}
          <div className="mt-6 rounded-2xl bg-[#FAFAFA] border border-[#E8E8E8] p-4 text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#A8A8A9] font-medium block">Order Reference</span>
              <span className="font-mono font-bold text-[#17223B]">#{confirmedOrder.orderId.slice(0, 12).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[#A8A8A9] font-medium block">Razorpay Payment ID</span>
              <span className="font-mono font-bold text-emerald-700">{confirmedOrder.paymentId}</span>
            </div>
          </div>

          {/* Artwork Card */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#DEDBDB] bg-white p-4 text-left shadow-2xs">
            {confirmedOrder.artwork.image_url ? (
              <img
                src={confirmedOrder.artwork.image_url}
                alt={confirmedOrder.artwork.title}
                className="h-20 w-20 rounded-xl object-cover border border-[#DEDBDB] shrink-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-[#FDF0F3] flex items-center justify-center text-2xl shrink-0">
                🎨
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="rounded bg-[#FDF0F3] px-2 py-0.5 text-[10px] font-bold text-[#F83758] uppercase">
                {confirmedOrder.artwork.is_digital ? '⚡ Instant Digital Edition' : '📦 Original Physical Piece'}
              </span>
              <h2 className="text-base font-black text-[#17223B] truncate mt-1">
                {confirmedOrder.artwork.title}
              </h2>
              <p className="text-xs text-[#626262]">
                {confirmedOrder.artwork.medium || 'Fine Art Original'}
              </p>
              <p className="text-sm font-black text-[#F83758] mt-1">
                ₹{confirmedOrder.totalPaid.toLocaleString('en-IN')} Paid
              </p>
            </div>
          </div>

          {/* DIGITAL ARTWORK SPECIAL DELIVERY SECTION */}
          {confirmedOrder.artwork.is_digital && (
            <div className="mt-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📥</span>
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wide">
                  Your Digital Masterpiece is Ready
                </h3>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed mb-4">
                Congratulations! You now own the verified high-resolution master file of this collectible. Download your file below or access it anytime in your collection profile.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={confirmedOrder.downloadUrl || confirmedOrder.artwork.image_url || '#'}
                  download={confirmedOrder.artwork.title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs md:text-sm font-black text-white shadow-md inline-flex items-center gap-2 transition active:scale-95"
                >
                  <span>⬇️ Download High-Res Artwork</span>
                </a>

                <button
                  onClick={() =>
                    setCoaData({
                      orderId: confirmedOrder.orderId,
                      orderDate: new Date().toISOString(),
                      artworkTitle: confirmedOrder.artwork.title,
                      artistName: 'Artelio Verified Studio',
                      medium: confirmedOrder.artwork.medium,
                      isDigital: true,
                      collectorName: userEmail || 'Verified Patron',
                      imageUrl: confirmedOrder.artwork.image_url,
                    })
                  }
                  className="rounded-xl border border-emerald-600/40 bg-white hover:bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>📜 Certificate of Authenticity</span>
                </button>

                <button
                  onClick={() =>
                    setInvoiceData({
                      orderId: confirmedOrder.orderId,
                      artworkTitle: confirmedOrder.artwork.title,
                      buyerName: userEmail || 'Verified Collector',
                      buyerAddress: 'Digital Delivery / Registered Account',
                      amount: confirmedOrder.totalPaid,
                      date: new Date().toLocaleDateString('en-IN'),
                    })
                  }
                  className="rounded-xl border border-emerald-600/40 bg-white hover:bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>🧾 Tax Invoice</span>
                </button>
              </div>
            </div>
          )}

          {/* PHYSICAL ARTWORK DELIVERY SECTION */}
          {!confirmedOrder.artwork.is_digital && (
            <div className="mt-6 rounded-2xl border border-[#DEDBDB] bg-[#FAFAFA] p-5 text-left text-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-[#17223B]">
                <span className="text-base text-[#F83758]">📍</span>
                <span>Delivery Destination</span>
              </div>
              <p className="font-bold text-[#17223B]">{confirmedOrder.shipping.name}</p>
              <p className="text-[#626262] mt-0.5">
                {confirmedOrder.shipping.address}, {confirmedOrder.shipping.city}, {confirmedOrder.shipping.state} - {confirmedOrder.shipping.postalCode}
              </p>
              <p className="text-[#626262] mt-0.5">Contact: {confirmedOrder.shipping.phone}</p>
              <div className="mt-3 rounded-lg bg-white border border-[#E8E8E8] p-3 text-[11px] text-[#626262]">
                🚚 <strong>Estimated Dispatch:</strong> Atelier artist will carefully package and dispatch this piece within 24-48 business hours with live courier GPS tracking.
              </div>
            </div>
          )}

          {/* Next Steps Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/profile"
              className="w-full sm:w-auto rounded-xl bg-[#F83758] hover:bg-[#E02244] px-6 py-3 text-xs md:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95"
            >
              🛍️ View in My Purchases
            </Link>
            <Link
              href="/browse"
              className="w-full sm:w-auto rounded-xl border border-[#DEDBDB] bg-white hover:bg-[#F3F3F3] px-6 py-3 text-xs md:text-sm font-bold text-[#17223B] transition"
            >
              🎨 Continue Shopping Gallery
            </Link>
          </div>
        </div>

        {coaData && <CertificateModal data={coaData} onClose={() => setCoaData(null)} />}
        {invoiceData && <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />}
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent"></div>
        <p className="mt-4 text-sm text-ink/60">Preparing secure checkout…</p>
      </main>
    );
  }

  if (!artwork) {
    return (
      <main className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="text-xl font-bold text-ink">Artwork not found</h1>
        <p className="mt-2 text-sm text-ink/60">This artwork may have been removed or is no longer listed.</p>
        <Link href="/browse" className="mt-6 inline-block font-semibold text-brand hover:underline">
          Return to Gallery
        </Link>
      </main>
    );
  }

  const unavailable = artwork.sold && !artwork.is_digital;
  const shippingFee = artwork.is_digital ? 0 : Number(artwork.shipping_fee || 0);
  const totalAmount = Number(artwork.price) + shippingFee;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <Link href={`/artwork/${artwork.id}`} className="text-sm font-medium text-brand hover:underline">
            ← Back to artwork details
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Secure Checkout
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Escrow-protected purchase with 48-hour collector satisfaction window.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Delivery Form or Digital Notice */}
          <div className="lg:col-span-7">
            {artwork.is_digital ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ink">Instant Digital Release</h2>
                    <p className="mt-1 text-sm text-ink/70">
                      This is an authentic digital edition. No physical shipment is required. Once payment is confirmed, the full-resolution master file will be unlocked immediately in your account.
                    </p>
                    {userEmail && (
                      <p className="mt-3 text-xs font-medium text-ink/50">
                        Download link will be attached to: <span className="text-brand">{userEmail}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Shipping Destination</h2>
                    <p className="text-xs text-ink/60">Where should the artist dispatch this original work?</p>
                    {artwork.ships_from && (
                      <p className="text-xs text-[#F83758] font-semibold mt-1">
                        📍 Ships from: <span className="text-ink font-bold">{artwork.ships_from}</span>
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Estimated delivery: within 7 days of payment
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80">Recipient Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Aditi Sharma"
                      value={shipping.name}
                      onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80">Contact Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="10-digit number for delivery updates & OTP"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink/80">Street Address & Apartment *</label>
                    <input
                      type="text"
                      placeholder="House / Flat No., Building, Street Name"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink/80">City *</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink/80">State *</label>
                      <input
                        type="text"
                        placeholder="e.g. Maharashtra"
                        value={shipping.state}
                        onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink/80">PIN Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. 400001"
                        value={shipping.postalCode}
                        onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-ink/5 p-3.5 text-xs text-ink/70">
                  <span className="font-semibold text-ink">📦 Packaging Promise:</span> Physical artworks are secured in custom rigid packaging with moisture-barrier wrapping and corner protectors.
                </div>
              </div>
            )}

            {/* Trust and Safety Badges */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-ink/10 bg-white/40 p-3.5 text-center">
                <div className="text-xl">🛡️</div>
                <h3 className="mt-1 text-xs font-bold text-ink">Escrow Guarantee</h3>
                <p className="mt-0.5 text-[11px] text-ink/60">Payment held safely until you inspect the work.</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white/40 p-3.5 text-center">
                <div className="text-xl">📜</div>
                <h3 className="mt-1 text-xs font-bold text-ink">Certificate of Origin</h3>
                <p className="mt-0.5 text-[11px] text-ink/60">Verified direct from the artist's studio.</p>
              </div>
              <div className="rounded-xl border border-ink/10 bg-white/40 p-3.5 text-center">
                <div className="text-xl">🔒</div>
                <h3 className="mt-1 text-xs font-bold text-ink">Encrypted Gateway</h3>
                <p className="mt-0.5 text-[11px] text-ink/60">Processed via certified Razorpay infrastructure.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Matching Figma Screen 13 & 14) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-[#DEDBDB] bg-white p-6 text-[#17223B] shadow-stylish-card">
              <h2 className="font-sans text-xl font-extrabold text-[#17223B]">Order Summary</h2>

              <div className="mt-5 flex gap-4 border-b border-[#E8E8E8] pb-5">
                <div
                  className="h-24 w-20 shrink-0 rounded-lg bg-[#F3F3F3] bg-cover bg-center border border-[#DEDBDB]"
                  style={artwork.image_url ? { backgroundImage: `url(${artwork.image_url})` } : undefined}
                />
                <div className="flex flex-col justify-center">
                  <p className="font-bold text-[#17223B] text-base">{artwork.title}</p>
                  {artwork.medium && (
                    <p className="text-xs text-[#626262] mt-0.5">{artwork.medium}</p>
                  )}
                  <p className="mt-1.5 text-base font-extrabold text-[#F83758]">
                    ₹{artwork.price.toLocaleString('en-IN')}
                  </p>
                  <span className="mt-1 text-[11px] font-semibold text-emerald-600">
                    {artwork.is_digital ? '✨ Instant Master Download' : '🖼️ Free Insured Delivery'}
                  </span>
                </div>
              </div>

              {/* Payment Methods (from Figma Screen 14) */}
              <div className="mt-4 pt-2 border-b border-[#E8E8E8] pb-4">
                <p className="text-xs font-bold text-[#17223B] uppercase mb-2">Supported Payment Options</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-[#F3F3F3] text-[11px] font-bold rounded border border-gray-200">UPI / GPay / PhonePe</span>
                  <span className="px-2.5 py-1 bg-[#F3F3F3] text-[11px] font-bold rounded border border-gray-200">Debit / Credit Cards</span>
                  <span className="px-2.5 py-1 bg-[#F3F3F3] text-[11px] font-bold rounded border border-gray-200">NetBanking</span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-sm text-[#626262]">
                <div className="flex justify-between">
                  <span>Artist Value / Original Work</span>
                  <span className="font-bold text-[#17223B]">₹{Math.round(Number(artwork.price) / 1.1).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#626262]">Platform Marketplace Fee (10%)</span>
                  <span className="font-semibold text-emerald-700">+₹{(Number(artwork.price) - Math.round(Number(artwork.price) / 1.1)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-[#17223B]">
                    {artwork.is_digital
                      ? 'N/A (Digital Edition)'
                      : shippingFee === 0
                      ? 'Free Insured Shipping'
                      : `₹${shippingFee.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {!artwork.is_digital && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Estimated Delivery</span>
                    <span>Within 7 days of payment</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Certificate of Authenticity</span>
                  <span className="font-bold text-emerald-600">Included (₹0)</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E8E8E8] pt-4 text-[#17223B]">
                <span className="font-bold text-base">Order Total</span>
                <span className="font-sans text-2xl font-black text-[#F83758]">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {unavailable && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-bold">
                  ⚠️ This artwork has already been acquired by another collector.
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-semibold">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying || unavailable}
                className="mt-6 w-full rounded-md bg-[#F83758] hover:bg-[#E02244] py-3.5 text-sm font-bold text-white shadow-stylish-btn transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wide"
              >
                {paying ? 'Connecting to payment…' : `Proceed to Payment • ₹${totalAmount.toLocaleString('en-IN')}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#A8A8A9]">
                <span>🔒 Safe &amp; Secure 256-Bit Escrow Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
