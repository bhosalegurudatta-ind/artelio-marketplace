'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';

type Artwork = { id: string; title: string; price: number; image_url: string | null; sold: boolean; is_digital: boolean };

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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('artworks')
        .select('id, title, price, image_url, sold, is_digital')
        .eq('id', params.id)
        .single();
      setArtwork(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handlePay() {
    if (!artwork) return;
    setPaying(true);
    setErrorMsg('');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setErrorMsg('Please log in before checking out.');
      setPaying(false);
      return;
    }
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 1. Our server creates the order. It looks up the price itself; we send only the artwork id.
    const orderRes = await fetch('/api/razorpay-order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ artworkId: artwork.id }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      setErrorMsg(orderData.error ?? 'Could not start payment.');
      setPaying(false);
      return;
    }

    // 2. Razorpay's payment window.
    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Artelio Marketplace',
      description: artwork.title,
      order_id: orderData.orderId,
      handler: async function (response: any) {
        // 3. Our server checks the payment before anything is marked as paid.
        const verifyRes = await fetch('/api/razorpay-verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        if (verifyRes.ok) {
          router.push('/orders');
        } else {
          const err = await verifyRes.json().catch(() => ({}));
          setErrorMsg(err.error ?? 'Payment went through but we could not confirm it. Contact support with your payment ID.');
          setPaying(false);
        }
      },
      modal: { ondismiss: () => setPaying(false) },
      theme: { color: '#6366F1' },
    });
    razorpay.open();
  }

  if (loading) return <main className="mx-auto max-w-md px-5 py-24 text-ink/60">Loading…</main>;
  if (!artwork) return <main className="mx-auto max-w-md px-5 py-24 text-ink/60">Artwork not found.</main>;

  const unavailable = artwork.sold && !artwork.is_digital;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="mx-auto max-w-md px-5 py-16">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-ink">Checkout</h1>

          <div className="mt-6 flex gap-4 border-y border-ink/10 py-5">
            <div
              className="h-24 w-20 shrink-0 rounded-lg bg-paper bg-cover bg-center"
              style={artwork.image_url ? { backgroundImage: `url(${artwork.image_url})` } : undefined}
            />
            <div>
              <p className="font-semibold text-ink">{artwork.title}</p>
              <p className="mt-1 text-sm text-ink/60">₹{artwork.price.toLocaleString('en-IN')}</p>
              {artwork.is_digital && <p className="mt-2 text-xs text-malachite">Includes a full-quality digital download</p>}
            </div>
          </div>

          <div className="mt-5 flex justify-between text-ink">
            <span>Total</span>
            <span className="font-serif text-lg font-bold">₹{artwork.price.toLocaleString('en-IN')}</span>
          </div>

          {unavailable && <p className="mt-4 text-sm text-clay">This piece has already been sold.</p>}
          {errorMsg && <p className="mt-4 text-sm text-clay">{errorMsg}</p>}

          <button
            onClick={handlePay}
            disabled={paying || unavailable}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-vermilion via-magenta to-brand py-3 text-sm font-bold text-white shadow-md hover:shadow-art-glow hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {paying ? 'Opening payment…' : 'Pay now'}
          </button>

          <p className="mt-4 text-center text-xs text-ink/40">
            Payments are handled securely by Razorpay. Artelio never sees your card details.
          </p>
        </div>
      </main>
    </>
  );
}
