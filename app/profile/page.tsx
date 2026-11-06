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
  const [activeTab, setActiveTab] = useState<'acquisitions' | 'artworks' | 'sales' | 'shipping'>('acquisitions');

  // Buyer purchases
  const [purchases, setPurchases] = useState<Order[]>([]);
  // Uploaded artworks (artists only)
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  // Artist sales orders (artists only)
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

        let resolvedProfile: UserProfile = {
          id: user.id,
          name: meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'Member'),
          email: user.email || '',
          role: meta.role === 'artist' ? 'artist' : 'customer',
          created_at: user.created_at || new Date().toISOString(),
        };

        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, role, bio, address, phone, paid_until, payout_upi_id, payout_method, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (dbUser) {
          resolvedProfile = {
            ...resolvedProfile,
            name: dbUser.name || resolvedProfile.name,
            role: dbUser.role === 'artist' ? 'artist' : 'customer',
            bio: dbUser.bio,
            address: dbUser.address,
            phone: dbUser.phone,
            paid_until: dbUser.paid_until,
            payout_upi_id: dbUser.payout_upi_id,
            payout_method: dbUser.payout_method,
          };
        }

        if (mounted) {
          setProfile(resolvedProfile);
          if (resolvedProfile.role === 'artist') {
            setActiveTab('artworks');
          }
        }

        // 1. Fetch user purchases
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id, status, created_at, shipped_at, delivered_at,
            courier_name, tracking_note, tracking_url,
            shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code,
            artworks (
              id, title, price, image_url, is_digital, medium, artist_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (mounted && ordersData) {
          setPurchases(ordersData as any);
        }

        // 2. If artist, fetch uploaded pieces and incoming sales
        if (resolvedProfile.role === 'artist') {
          const { data: artsData } = await supabase
            .from('artworks')
            .select('id, title, price, image_url, sold, is_digital, medium, created_at')
            .eq('artist_id', user.id)
            .order('created_at', { ascending: false });

          if (mounted && artsData) {
            setArtworks(artsData);
          }

          const { data: artistOrders } = await supabase
            .from('orders')
            .select(`
              id, status, created_at, shipped_at, delivered_at,
              courier_name, tracking_note, tracking_url,
              shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_postal_code,
              artworks!inner (
                id, title, price, image_url, is_digital, medium, artist_id
              )
            `)
            .eq('artworks.artist_id', user.id)
            .order('created_at', { ascending: false });

          if (mounted && artistOrders) {
            setArtistSales(artistOrders as any);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-xl font-bold text-[#17223B]">Sign In Required</h1>
        <p className="mt-2 text-xs text-[#626262]">Please log in to access your profile and collection.</p>
        <Link href="/login" className="mt-4 inline-block rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn">
          Go to Login
        </Link>
      </main>
    );
  }

  const isArtist = profile.role === 'artist';

  const getArtworkDeliveryStatus = (artId: string, isSold: boolean) => {
    if (!isSold) return { label: 'Active in Gallery', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const matchingSale = artistSales.find((s) => s.artworks?.id === artId);
    if (!matchingSale) return { label: 'Sold', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (matchingSale.status === 'delivered') return { label: 'Delivered (Reached Buyer)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (matchingSale.status === 'shipped') return { label: 'In Transit (Shipped)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    return { label: 'Sold (Awaiting Dispatch)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12 text-[#17223B]">
      {/* Profile Header Card (Figma Stylish White Card) */}
      <div className="rounded-2xl border border-[#DEDBDB] bg-white p-6 sm:p-8 shadow-stylish-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* User Avatar Circle */}
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-[#FDF0F3] border-2 border-[#F83758] text-2xl sm:text-3xl font-black text-[#F83758] shadow-xs">
              {profile.name ? profile.name[0].toUpperCase() : 'U'}
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17223B]">
                  {profile.name}
                </h1>
                <span className="rounded-full bg-[#F3F3F3] px-2.5 py-0.5 text-[11px] font-bold text-[#626262]">
                  {isArtist ? '🎨 Artist Atelier' : '🛍️ Buyer / Collector'}
                </span>
                {isArtist && profile.payout_upi_id && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span>⚡ UPI:</span>
                    <span>{profile.payout_upi_id}</span>
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-[#626262] font-mono">{profile.email}</p>
              {profile.bio && <p className="mt-1.5 text-xs text-[#17223B]/80 italic max-w-xl">&ldquo;{profile.bio}&rdquo;</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isArtist ? (
              <>
                <Link
                  href="/dashboard/upload"
                  className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-4 py-2 text-xs font-bold text-white shadow-stylish-btn transition active:scale-95"
                >
                  + Upload Artwork
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md border border-[#DEDBDB] bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-[#17223B] transition shadow-2xs"
                >
                  Studio
                </Link>
              </>
            ) : (
              <Link
                href="/browse"
                className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-4 py-2 text-xs font-bold text-white shadow-stylish-btn transition"
              >
                Explore Products →
              </Link>
            )}

            <Link
              href="/settings"
              className="rounded-md border border-[#DEDBDB] bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-[#17223B] transition shadow-2xs"
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        {isArtist ? (
          <div className="mt-6 pt-6 border-t border-[#F0F0F0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Artworks Listed</span>
              <span className="text-xl font-black text-[#17223B]">{artworks.length}</span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Pieces Sold</span>
              <span className="text-xl font-black text-emerald-600">
                {artworks.filter((a) => a.sold).length}
              </span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Active in Gallery</span>
              <span className="text-xl font-black text-[#F83758]">
                {artworks.filter((a) => !a.sold).length}
              </span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Payout Destination</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                {profile.payout_upi_id ? '✓ UPI Active' : '⚠ Set UPI in Settings'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-[#F0F0F0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Purchases</span>
              <span className="text-xl font-black text-[#17223B]">{purchases.length}</span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Physical Pieces</span>
              <span className="text-xl font-black text-[#F83758]">
                {purchases.filter((p) => !p.artworks?.is_digital).length}
              </span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Digital Works</span>
              <span className="text-xl font-black text-[#4392F9]">
                {purchases.filter((p) => p.artworks?.is_digital).length}
              </span>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] p-3">
              <span className="block text-[11px] text-[#626262] font-semibold">Status</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 mt-1">
                ✓ Verified Patron
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#F0F0F0] pb-1">
        <button
          onClick={() => setActiveTab('acquisitions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
            activeTab === 'acquisitions'
              ? 'border-[#F83758] text-[#F83758]'
              : 'border-transparent text-[#626262] hover:text-[#17223B]'
          }`}
        >
          <span>🛍️</span>
          <span>{isArtist ? 'Personal Acquisitions' : 'My Purchases'}</span>
          <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-xs text-[#626262]">
            {purchases.length}
          </span>
        </button>

        {isArtist && (
          <button
            onClick={() => setActiveTab('artworks')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
              activeTab === 'artworks'
                ? 'border-[#F83758] text-[#F83758]'
                : 'border-transparent text-[#626262] hover:text-[#17223B]'
            }`}
          >
            <span>🎨</span>
            <span>My Artworks in Gallery</span>
            <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-xs text-[#626262]">
              {artworks.length}
            </span>
          </button>
        )}

        {isArtist && (
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
              activeTab === 'sales'
                ? 'border-[#F83758] text-[#F83758]'
                : 'border-transparent text-[#626262] hover:text-[#17223B]'
            }`}
          >
            <span>📦</span>
            <span>Orders to Ship</span>
            <span className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-xs text-[#626262]">
              {artistSales.length}
            </span>
          </button>
        )}

        {!isArtist && (
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs md:text-sm font-bold transition ${
              activeTab === 'shipping'
                ? 'border-[#F83758] text-[#F83758]'
                : 'border-transparent text-[#626262] hover:text-[#17223B]'
            }`}
          >
            <span>📍</span>
            <span>Delivery Address</span>
          </button>
        )}
      </div>

      {/* Tab: Buyer Purchases */}
      {activeTab === 'acquisitions' && (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <div className="rounded-2xl border border-[#DEDBDB] bg-white p-12 text-center shadow-stylish-card">
              <span className="text-4xl block mb-3">🛍️</span>
              <h2 className="text-lg font-bold text-[#17223B]">No Purchases Yet</h2>
              <p className="mt-1 text-xs text-[#626262] max-w-sm mx-auto">
                You haven't bought any artworks yet. Discover trending products and original art pieces.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/browse"
                  className="rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
                >
                  Explore Catalog →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {purchases.map((order) => {
                const art = order.artworks;
                return (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#DEDBDB] bg-white p-4 shadow-stylish-card"
                  >
                    <div className="flex items-center gap-3.5">
                      {art?.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.title || 'Artwork'}
                          className="h-16 w-16 rounded-lg object-cover border border-[#DEDBDB] shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-[#F3F3F3] flex items-center justify-center text-lg shrink-0">
                          🖼️
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#17223B]">
                            {art?.title || 'Fine Art Original'}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'delivered'
                                ? 'bg-blue-50 text-blue-700'
                                : order.status === 'shipped'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? 'Delivered'
                              : order.status === 'shipped'
                              ? 'In Transit'
                              : 'Confirmed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#626262] mt-0.5">
                          {art?.medium || (art?.is_digital ? 'Digital' : 'Physical')} •{' '}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-black text-[#F83758] mt-0.5">
                          ₹{art?.price?.toLocaleString('en-IN') || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] hover:bg-gray-50 transition"
                        >
                          📍 Track
                        </a>
                      )}

                      {art?.is_digital && (
                        <a
                          href={`/api/download/${order.id}`}
                          className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          ⬇ Download
                        </a>
                      )}

                      <button
                        onClick={() =>
                          setInvoiceData({
                            orderId: order.id,
                            artworkTitle: art?.title || 'Fine Art Artwork',
                            buyerName: order.shipping_name || profile.name,
                            buyerAddress: order.shipping_address || profile.address || 'Registered Address',
                            amount: art?.price || 0,
                            date: new Date(order.created_at).toLocaleDateString(),
                          })
                        }
                        className="rounded-md border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] hover:bg-gray-50 transition"
                      >
                        🧾 Invoice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Artist Uploaded Artworks with Reach Status */}
      {isArtist && activeTab === 'artworks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#626262]">
              Artworks Listed ({artworks.length})
            </h2>
            <Link
              href="/dashboard/upload"
              className="rounded-md bg-[#F83758] px-3.5 py-1.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
            >
              + Upload Another Piece
            </Link>
          </div>

          {artworks.length === 0 ? (
            <div className="rounded-2xl border border-[#DEDBDB] bg-white p-12 text-center shadow-stylish-card">
              <span className="text-4xl block mb-3">🎨</span>
              <h2 className="text-lg font-bold text-[#17223B]">No Artworks Listed Yet</h2>
              <p className="mt-1 text-xs text-[#626262] max-w-sm mx-auto">
                Upload your artworks to showcase them in the gallery.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/dashboard/upload"
                  className="rounded-md bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn hover:bg-[#E02244] transition"
                >
                  Upload Your First Artwork →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {artworks.map((art) => {
                const statusInfo = getArtworkDeliveryStatus(art.id, art.sold);
                return (
                  <div
                    key={art.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#DEDBDB] bg-white p-4 shadow-stylish-card"
                  >
                    <div className="flex items-center gap-3.5">
                      {art.image_url ? (
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="h-16 w-16 rounded-lg object-cover border border-[#DEDBDB] shrink-0"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-[#F3F3F3] flex items-center justify-center text-lg shrink-0">
                          🎨
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#17223B]">{art.title}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#626262] mt-0.5">
                          Medium: {art.medium || 'Original'} • {new Date(art.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-black text-[#F83758] mt-0.5">
                          ₹{art.price?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                      <Link
                        href={`/artwork/${art.id}`}
                        className="rounded-md border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] hover:bg-gray-50 transition"
                      >
                        👁️ View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Artist Orders to Ship */}
      {isArtist && activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#626262]">
              Orders to Ship ({artistSales.length})
            </h2>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-[#F83758] hover:underline"
            >
              Open Studio Dashboard →
            </Link>
          </div>

          {artistSales.length === 0 ? (
            <div className="rounded-2xl border border-[#DEDBDB] bg-white p-12 text-center shadow-stylish-card">
              <span className="text-4xl block mb-3">📦</span>
              <h2 className="text-lg font-bold text-[#17223B]">No Pending Orders</h2>
              <p className="mt-1 text-xs text-[#626262]">
                When a buyer orders your artwork, shipping details will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {artistSales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-xl border border-[#DEDBDB] bg-white p-4 shadow-stylish-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-mono text-[#A8A8A9]">Order #{sale.id.slice(0, 8).toUpperCase()}</span>
                    <h3 className="text-sm font-bold text-[#17223B] mt-0.5">
                      {sale.artworks?.title || 'Fine Art Piece'}
                    </h3>
                    <p className="text-xs text-[#626262] mt-0.5">
                      Ship to: <strong>{sale.shipping_name || 'Buyer'}</strong> • {sale.shipping_city || ''}, {sale.shipping_state || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSlipOrder(sale)}
                      className="rounded-md border border-[#DEDBDB] bg-white px-3 py-1.5 text-xs font-bold text-[#17223B] hover:bg-gray-50 transition"
                    >
                      📄 Packing Slip
                    </button>
                    <button
                      onClick={() => setShippingOrder(sale)}
                      className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-3.5 py-1.5 text-xs font-bold text-white shadow-stylish-btn transition"
                    >
                      🚚 Ship Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Saved Delivery Address (Buyers Only) */}
      {!isArtist && activeTab === 'shipping' && (
        <div className="rounded-2xl border border-[#DEDBDB] bg-white p-6 sm:p-8 shadow-stylish-card">
          <h2 className="text-base font-black text-[#17223B] mb-1">Saved Delivery Address</h2>
          <p className="text-xs text-[#626262] mb-6">
            Pre-filled when you purchase original physical artworks for safe insured courier delivery.
          </p>

          <div className="rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
            <span className="text-[11px] font-bold text-[#626262] uppercase tracking-wider block mb-1">
              Primary Address
            </span>
            <p className="text-xs font-medium text-[#17223B]">
              {profile.address ? profile.address : 'No delivery address saved yet.'}
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/settings"
              className="rounded-md bg-[#F83758] hover:bg-[#E02244] px-5 py-2.5 text-xs font-bold text-white shadow-stylish-btn transition"
            >
              Update Address in Settings →
            </Link>
          </div>
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
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#A8A8A9]">Loading Profile…</div>}>
      <ProfileContent />
    </Suspense>
  );
}
