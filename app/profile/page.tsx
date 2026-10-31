'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CertificateModal from '@/components/CertificateModal';
import InvoiceModal from '@/components/InvoiceModal';
import ShipOrderModal from '@/components/ShipOrderModal';
import PackingSlipModal from '@/components/PackingSlipModal';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: 'artist' | 'customer';
  bio?: string | null;
  address?: string | null;
  phone?: string | null;
  paid_until?: string | null;
  payout_upi_id?: string | null;
  payout_method?: string | null;
  created_at: string;
};

type Artwork = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  sold: boolean;
  is_digital: boolean;
  medium?: string | null;
  created_at: string;
};

type Order = {
  id: string;
  status: string;
  created_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  courier_name?: string | null;
  tracking_note?: string | null;
  tracking_url?: string | null;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  artworks: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
    is_digital: boolean;
    medium?: string | null;
    artist_id: string;
  } | null;
};

function ProfileContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'acquisitions' | 'artworks' | 'sales'>('acquisitions');

  // Buyer purchases
  const [purchases, setPurchases] = useState<Order[]>([]);
  // Uploaded artworks
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  // Artist sales orders
  const [artistSales, setArtistSales] = useState<any[]>([]);

  // Modals
  const [coaData, setCoaData] = useState<any | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [shippingOrder, setShippingOrder] = useState<any | null>(null);
  const [slipOrder, setSlipOrder] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          if (mounted) setLoading(false);
          router.push('/login');
          return;
        }

        const user = authData.user;
        const meta = user.user_metadata || {};

        // Fallback default profile from auth session
        let resolvedProfile: UserProfile = {
          id: user.id,
          name: meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'Member'),
          email: user.email || '',
          role: (meta.role === 'artist' ? 'artist' : 'customer') as any,
          bio: meta.bio || null,
          address: meta.address || null,
          created_at: user.created_at || new Date().toISOString(),
        };

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        // 1. Fetch user profile from database
        try {
          const { data: dbProfile } = await supabase
            .from('users')
            .select('id, name, email, role, bio, address, paid_until, payout_method, payout_upi_id, created_at')
            .eq('id', user.id)
            .maybeSingle();

          if (dbProfile) {
            resolvedProfile = { ...resolvedProfile, ...dbProfile };
          } else if (token) {
            const pRes = await fetch('/api/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const pData = await pRes.json().catch(() => ({}));
            if (pData?.profile) {
              resolvedProfile = { ...resolvedProfile, ...pData.profile };
            }
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }

        if (mounted) {
          setProfile(resolvedProfile);
          if (resolvedProfile.role === 'artist') {
            setActiveTab('artworks');
          } else {
            setActiveTab('acquisitions');
          }
        }

        // 2. Fetch Buyer Acquisitions (Purchases)
        try {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('id, status, created_at, shipped_at, delivered_at, courier_name, tracking_note, tracking_url, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code, artworks(id, title, price, image_url, is_digital, medium, artist_id)')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

          if (mounted) {
            setPurchases((ordersData as any) || []);
          }
        } catch (e) {
          console.error('Error loading purchases:', e);
        }

        // 3. Fetch Uploaded Artworks (Both Artists and Users who uploaded)
        try {
          const { data: artData } = await supabase
            .from('artworks')
            .select('id, title, price, image_url, sold, is_digital, medium, created_at')
            .eq('artist_id', user.id)
            .order('created_at', { ascending: false });

          if (mounted) {
            setArtworks(artData || []);
          }
        } catch (e) {
          console.error('Error loading artworks:', e);
        }

        // 4. Fetch Sales of their artwork (which reached, which in transit)
        if (token) {
          try {
            const salesRes = await fetch('/api/artist/orders', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const salesData = await salesRes.json().catch(() => ({}));
            if (salesData?.orders && mounted) {
              setArtistSales(salesData.orders);
            }
          } catch {
            // Optional
          }
        }
      } catch (err) {
        console.error('Overall profile load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-5 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-xl font-bold text-white">Sign In Required</h1>
        <p className="mt-2 text-sm text-slate-400">Please log in to access your profile and acquisitions.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950">
          Go to Login
        </Link>
      </main>
    );
  }

  // Compute artwork delivery statuses for uploaded pieces
  const getArtworkDeliveryStatus = (artId: string, isSold: boolean) => {
    if (!isSold) return { label: 'Active in Gallery', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    const matchingSale = artistSales.find((s) => s.artworks?.id === artId);
    if (!matchingSale) return { label: 'Sold', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    if (matchingSale.status === 'delivered') return { label: 'Delivered (Reached Buyer)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (matchingSale.status === 'shipped') return { label: 'In Transit (Shipped)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    return { label: 'Sold (Awaiting Dispatch)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#161F33] to-[#0E1524] p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* User Avatar Circle */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-3xl font-serif font-black text-slate-950 shadow-lg shadow-amber-500/20">
              {profile.name ? profile.name[0].toUpperCase() : 'U'}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#161F33] bg-emerald-500 flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {profile.name}
                </h1>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 border border-white/10">
                  {profile.role === 'artist' ? '🎨 Artist Atelier' : '🖼️ Art Collector'}
                </span>
                {profile.payout_upi_id && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span>⚡ UPI:</span>
                    <span>{profile.payout_upi_id}</span>
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400 font-mono">{profile.email}</p>
              {profile.bio && <p className="mt-2 text-xs text-slate-300 max-w-xl italic">"{profile.bio}"</p>}
            </div>
          </div>

          {/* Action Buttons - Upload is ONLY visible to artists */}
          <div className="flex flex-wrap items-center gap-2.5">
            {profile.role === 'artist' ? (
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:scale-105 active:scale-95"
              >
                <span className="text-sm font-black">+</span>
                <span>Upload Artwork</span>
              </Link>
            ) : (
              <Link
                href="/browse"
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition"
              >
                <span>Explore Gallery</span>
              </Link>
            )}

            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-xs text-slate-400 font-medium">Acquisitions</span>
            <span className="font-serif text-xl font-bold text-white">{purchases.length}</span>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-xs text-slate-400 font-medium">Artworks Uploaded</span>
            <span className="font-serif text-xl font-bold text-white">{artworks.length}</span>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-xs text-slate-400 font-medium">Pieces Reached Buyers</span>
            <span className="font-serif text-xl font-bold text-emerald-400">
              {artworks.filter((a) => a.sold).length}
            </span>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <span className="block text-xs text-slate-400 font-medium">Payout Status</span>
            <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1 mt-1">
              {profile.payout_upi_id ? '✓ UPI Linked' : '⚠ Set UPI in Settings'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('acquisitions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'acquisitions'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🛍️</span>
          <span>My Acquisitions (Bought Until Now)</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
            {purchases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('artworks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'artworks'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🎨</span>
          <span>Uploaded Artworks & Delivery Status</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
            {artworks.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BUYER ACQUISITIONS (What you bought until now)           */}
      {/* ============================================================== */}
      {activeTab === 'acquisitions' && (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            /* Empty State for Buyers */
            <div className="rounded-3xl border border-white/10 bg-[#121826] p-12 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                🖼️
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">No Artworks Acquired Yet</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                You haven't bought any artworks until now. Explore our curated fine art galleries to acquire original paintings and masterworks directly from independent creators.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/browse"
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:from-amber-400 hover:to-amber-500 transition"
                >
                  Explore the Gallery
                </Link>
                <Link
                  href="/spaces"
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Virtual Room Visualizer
                </Link>
              </div>
            </div>
          ) : (
            /* List of Purchases */
            <div className="grid grid-cols-1 gap-4">
              {purchases.map((order) => {
                const art = order.artworks;
                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      {art?.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="h-20 w-20 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          🎨
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-white">
                            {art?.title || 'Fine Art Original'}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                              order.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : order.status === 'shipped'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? 'Delivered (Reached)'
                              : order.status === 'shipped'
                              ? 'In Transit'
                              : 'Paid (Escrow Secured)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Acquired on {new Date(order.created_at).toLocaleDateString()} • Format:{' '}
                          <span className="text-white font-medium">
                            {art?.is_digital ? 'Digital Archival Master' : 'Original Physical Piece'}
                          </span>
                        </p>
                        <p className="text-sm font-bold text-amber-400 mt-1">
                          ₹{art?.price?.toLocaleString('en-IN') || 0}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons for buyer */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                      <button
                        onClick={() =>
                          setInvoiceData({
                            orderId: order.id,
                            artworkTitle: art?.title || 'Fine Art',
                            artworkPrice: art?.price || 0,
                            isDigital: art?.is_digital,
                            buyerName: order.shipping_name || profile.name,
                            buyerAddress: order.shipping_address,
                            buyerCity: order.shipping_city,
                            buyerState: order.shipping_state,
                            buyerPostalCode: order.shipping_postal_code,
                            date: new Date(order.created_at).toLocaleDateString(),
                          })
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                      >
                        📄 Tax Invoice
                      </button>

                      <button
                        onClick={() =>
                          setCoaData({
                            artworkTitle: art?.title || 'Fine Art',
                            artistName: 'Verified Independent Artist',
                            editionType: art?.is_digital ? 'Archival Digital Edition' : '1 of 1 Original',
                            medium: art?.medium || 'Fine Art Pigments on Canvas',
                            date: new Date(order.created_at).toLocaleDateString(),
                            certificateId: `COA-${order.id.slice(0, 8).toUpperCase()}`,
                          })
                        }
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        📜 View COA
                      </button>

                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                        >
                          📦 Track Courier ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: UPLOADED ARTWORKS (Which reached and which have not)      */}
      {/* ============================================================== */}
      {activeTab === 'artworks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Artworks Uploaded by You ({artworks.length})
            </h2>
            {profile.role === 'artist' && (
              <Link
                href="/dashboard/upload"
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 transition"
              >
                + Upload Another Piece
              </Link>
            )}
          </div>

          {artworks.length === 0 ? (
            /* Empty State for Artworks */
            <div className="rounded-3xl border border-white/10 bg-[#121826] p-12 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                🎨
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">
                {profile.role === 'artist' ? 'No Artworks Uploaded Yet' : 'Artist Atelier Exclusive'}
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                {profile.role === 'artist'
                  ? "You haven't listed any art pieces yet. List your original paintings, sculptures, or digital art pieces for collectors."
                  : 'Only verified artist atelier accounts can upload and list artworks. If you want to sell your artwork, you can switch to an Artist in Settings.'}
              </p>
              <div className="mt-6 flex justify-center">
                {profile.role === 'artist' ? (
                  <Link
                    href="/dashboard/upload"
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:from-amber-400 transition"
                  >
                    Upload Your First Artwork
                  </Link>
                ) : (
                  <Link
                    href="/settings"
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:from-amber-400 transition"
                  >
                    Switch to Artist in Settings
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* List of Uploaded Artworks with Status */
            <div className="grid grid-cols-1 gap-4">
              {artworks.map((art) => {
                const statusInfo = getArtworkDeliveryStatus(art.id, art.sold);
                return (
                  <div
                    key={art.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      {art.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="h-20 w-20 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          🎨
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold text-white">{art.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Medium: <span className="text-slate-200">{art.medium || 'Original Fine Art'}</span> •{' '}
                          Uploaded on {new Date(art.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold text-amber-400 mt-1">
                          ₹{art.price?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                      <Link
                        href={`/artwork/${art.id}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                      >
                        👁️ View in Gallery
                      </Link>

                      <button
                        onClick={() =>
                          setCoaData({
                            artworkTitle: art.title,
                            artistName: profile.name,
                            editionType: art.is_digital ? 'Archival Digital Edition' : '1 of 1 Original',
                            medium: art.medium || 'Fine Art Pigments on Canvas',
                            date: new Date(art.created_at).toLocaleDateString(),
                            certificateId: `COA-${art.id.slice(0, 8).toUpperCase()}`,
                          })
                        }
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        📜 Print COA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {coaData && <CertificateModal {...coaData} onClose={() => setCoaData(null)} />}
      {invoiceData && <InvoiceModal {...invoiceData} onClose={() => setInvoiceData(null)} />}
      {shippingOrder && (
        <ShipOrderModal
          order={shippingOrder}
          isOpen={Boolean(shippingOrder)}
          onClose={() => setShippingOrder(null)}
          onSuccess={() => setShippingOrder(null)}
        />
      )}
      {slipOrder && <PackingSlipModal order={slipOrder} onClose={() => setSlipOrder(null)} />}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Profile…</div>}>
      <ProfileContent />
    </Suspense>
  );
}
