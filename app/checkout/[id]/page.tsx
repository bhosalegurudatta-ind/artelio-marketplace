'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Artwork = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  sold: boolean;
  is_digital: boolean;
  medium?: string | null;
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

      const { data } = await supabase
        .from('artworks')
        .select('id, title, price, image_url, sold, is_digital, medium')
        .eq('id', params.id)
        .single();

      setArtwork(data);
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
          router.push('/orders?new_order=1');
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
                <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Shipping Destination</h2>
                    <p className="text-xs text-ink/60">Where should the artist dispatch this original work?</p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    Insured Art Courier
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

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-ink/10 bg-[#121826] p-6 text-white shadow-xl">
              <h2 className="font-serif text-xl font-bold">Order Summary</h2>

              <div className="mt-5 flex gap-4 border-b border-white/10 pb-5">
                <div
                  className="h-24 w-20 shrink-0 rounded-lg bg-paper bg-cover bg-center border border-white/10"
                  style={artwork.image_url ? { backgroundImage: `url(${artwork.image_url})` } : undefined}
                />
                <div className="flex flex-col justify-center">
                  <p className="font-semibold text-white">{artwork.title}</p>
                  {artwork.medium && (
                    <p className="text-xs text-white/50">{artwork.medium}</p>
                  )}
                  <p className="mt-1.5 text-sm font-semibold text-marigold">
                    ₹{artwork.price.toLocaleString('en-IN')}
                  </p>
                  <span className="mt-1 text-[11px] text-white/60">
                    {artwork.is_digital ? '✨ Instant Master Download' : '🖼️ Original Physical Piece'}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Artwork Price</span>
                  <span className="font-medium text-white">₹{artwork.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insured Packaging & Transit</span>
                  <span className="font-medium text-malachite">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Buyer Protection</span>
                  <span className="font-medium text-malachite">Included</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-white">
                <span className="font-semibold">Total to Pay</span>
                <span className="font-serif text-2xl font-bold text-marigold">
                  ₹{artwork.price.toLocaleString('en-IN')}
                </span>
              </div>

              {unavailable && (
                <div className="mt-4 rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">
                  ⚠️ This artwork has already been sold to another collector.
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 rounded-xl border border-vermilion/30 bg-vermilion/10 p-3 text-xs text-vermilion">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying || unavailable}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-art-glow hover:scale-[1.01] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {paying ? 'Connecting to payment…' : `Pay ₹${artwork.price.toLocaleString('en-IN')}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
                <span>Supports UPI, Cards, NetBanking & EMI</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
