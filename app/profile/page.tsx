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

        // 2. Fetch Buyer Acquisitions (Purchases for all users)
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

        // 3. Only fetch artist data if user is an artist
        if (resolvedProfile.role === 'artist') {
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
        <p className="mt-2 text-sm text-slate-400">Please log in to access your profile and collection.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950">
          Go to Login
        </Link>
      </main>
    );
  }

  const isArtist = profile.role === 'artist';

  // Compute artwork delivery statuses for artist's uploaded pieces
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
      {/* ============================================================== */}
      {/* PROFILE HEADER CARD                                            */}
      {/* ============================================================== */}
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
                  {isArtist ? '🎨 Verified Artist Atelier' : '🖼️ Art Patron & Collector'}
                </span>
                {isArtist && profile.payout_upi_id && (
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

          {/* Action Buttons: Different for Collector vs Artist */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isArtist ? (
              <>
                <Link
                  href="/dashboard/upload"
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition hover:scale-105 active:scale-95"
                >
                  <span className="text-sm font-black">+</span>
                  <span>Upload Artwork</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition"
                >
                  <span>🎨</span>
                  <span>Studio</span>
                </Link>
              </>
            ) : (
              <Link
                href="/browse"
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition"
              >
                <span>Explore Fine Art Gallery →</span>
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

        {/* ============================================================== */}
        {/* STATS STRIP: STRICTLY SEPARATE FOR COLLECTOR VS ARTIST        */}
        {/* ============================================================== */}
        {isArtist ? (
          /* ARTIST STATS STRIP */
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Artworks Listed</span>
              <span className="font-serif text-xl font-bold text-white">{artworks.length}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Pieces Sold</span>
              <span className="font-serif text-xl font-bold text-emerald-400">
                {artworks.filter((a) => a.sold).length}
              </span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Active in Gallery</span>
              <span className="font-serif text-xl font-bold text-amber-300">
                {artworks.filter((a) => !a.sold).length}
              </span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Payout Destination</span>
              <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1 mt-1">
                {profile.payout_upi_id ? '✓ UPI Configured' : '⚠ Set UPI in Settings'}
              </span>
            </div>
          </div>
        ) : (
          /* BUYER / COLLECTOR STATS STRIP (ZERO SELLER STATS) */
          <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Art Pieces Acquired</span>
              <span className="font-serif text-xl font-bold text-white">{purchases.length}</span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Physical Pieces</span>
              <span className="font-serif text-xl font-bold text-amber-300">
                {purchases.filter((p) => !p.artworks?.is_digital).length}
              </span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Digital Masterpieces</span>
              <span className="font-serif text-xl font-bold text-blue-400">
                {purchases.filter((p) => p.artworks?.is_digital).length}
              </span>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <span className="block text-xs text-slate-400 font-medium">Membership</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-1">
                ✓ Verified Patron
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* NAVIGATION TABS: STRICTLY SEPARATE                            */}
      {/* ============================================================== */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-1">
        {/* Tab 1: Acquisitions (Always available for purchases) */}
        <button
          onClick={() => setActiveTab('acquisitions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'acquisitions'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>🛍️</span>
          <span>{isArtist ? 'Personal Acquisitions' : 'My Collection & Purchases'}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
            {purchases.length}
          </span>
        </button>

        {/* Tab 2: Uploaded Artworks (STRICTLY FOR ARTISTS ONLY) */}
        {isArtist && (
          <button
            onClick={() => setActiveTab('artworks')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'artworks'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🎨</span>
            <span>My Artworks in Gallery</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
              {artworks.length}
            </span>
          </button>
        )}

        {/* Tab 3: Sales Orders to Dispatch (STRICTLY FOR ARTISTS ONLY) */}
        {isArtist && (
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'sales'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>📦</span>
            <span>Orders to Ship</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
              {artistSales.length}
            </span>
          </button>
        )}

        {/* Tab 4: Delivery Address (For Collectors) */}
        {!isArtist && (
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'shipping'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>📍</span>
            <span>Delivery Address</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT: BUYER PURCHASES (ACQUISITIONS)                    */}
      {/* ============================================================== */}
      {activeTab === 'acquisitions' && (
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#121826] p-12 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                🖼️
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">Your Art Collection is Empty</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                You haven't acquired any artworks yet. Discover one-of-a-kind original paintings, archival prints, and digital masterworks from verified artists.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/browse"
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:from-amber-400 transition"
                >
                  Explore the Gallery →
                </Link>
              </div>
            </div>
          ) : (
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
                          alt={art.title || 'Artwork'}
                          className="h-20 w-20 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          🖼️
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
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : order.status === 'shipped'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {order.status === 'delivered'
                              ? 'Delivered'
                              : order.status === 'shipped'
                              ? 'In Transit'
                              : 'Order Confirmed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {art?.medium || (art?.is_digital ? 'Archival Digital Art' : 'Physical Artwork')} •{' '}
                          Purchased on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold text-amber-400 mt-1">
                          ₹{art?.price?.toLocaleString('en-IN') || '—'}
                        </p>

                        {/* Courier and tracking snippet */}
                        {order.courier_name && (
                          <div className="mt-2 text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-1.5 inline-block">
                            <span>🚚 {order.courier_name}</span>
                            {order.tracking_note && <span className="text-slate-400 font-mono ml-2">#{order.tracking_note}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                        >
                          📍 Track Courier
                        </a>
                      )}

                      {art?.is_digital && (
                        <a
                          href={`/api/download/${order.id}`}
                          className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                        >
                          ⬇ Download High-Res
                        </a>
                      )}

                      <button
                        onClick={() =>
                          setCoaData({
                            artworkTitle: art?.title || 'Original Artwork',
                            artistName: 'Artelio Verified Artist',
                            editionType: art?.is_digital ? 'Archival Digital Edition' : '1 of 1 Original Fine Art',
                            medium: art?.medium || 'Fine Art Pigments',
                            date: new Date(order.created_at).toLocaleDateString(),
                            certificateId: `COA-${order.id.slice(0, 8).toUpperCase()}`,
                          })
                        }
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        📜 Certificate (COA)
                      </button>

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
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
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

      {/* ============================================================== */}
      {/* TAB CONTENT: ARTIST LISTED ARTWORKS (ARTISTS ONLY)             */}
      {/* ============================================================== */}
      {isArtist && activeTab === 'artworks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Artworks Listed by Your Atelier ({artworks.length})
            </h2>
            <Link
              href="/dashboard/upload"
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 transition"
            >
              + Upload Another Piece
            </Link>
          </div>

          {artworks.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#121826] p-12 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                🎨
              </div>
              <h2 className="font-serif text-2xl font-bold text-white">No Artworks Listed Yet</h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                You haven't uploaded any artworks yet. List your original paintings, sculptures, or digital art pieces to present them to global art collectors.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/dashboard/upload"
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:from-amber-400 transition"
                >
                  Upload Your First Artwork →
                </Link>
              </div>
            </div>
          ) : (
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

      {/* ============================================================== */}
      {/* TAB CONTENT: ARTIST DISPATCH ORDERS (ARTISTS ONLY)            */}
      {/* ============================================================== */}
      {isArtist && activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Orders from Collectors Awaiting Shipment ({artistSales.length})
            </h2>
            <Link
              href="/dashboard"
              className="text-xs text-amber-400 hover:underline"
            >
              Open Full Studio Dashboard →
            </Link>
          </div>

          {artistSales.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#121826] p-12 text-center shadow-xl">
              <span className="text-3xl block mb-3">📦</span>
              <h2 className="font-serif text-xl font-bold text-white">No Pending Orders</h2>
              <p className="mt-1 text-xs text-slate-400">
                When a collector buys your artwork, order details and buyer shipping addresses will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {artistSales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-2xl border border-white/10 bg-[#121826] p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-mono text-slate-400">Order #{sale.id.slice(0, 8).toUpperCase()}</span>
                    <h3 className="font-serif text-lg font-bold text-white mt-1">
                      {sale.artworks?.title || 'Fine Art Piece'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Ship to: <strong>{sale.shipping_name || 'Collector'}</strong> • {sale.shipping_city || ''}, {sale.shipping_state || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSlipOrder(sale)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                      📄 Packing Slip
                    </button>
                    <button
                      onClick={() => setShippingOrder(sale)}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition"
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

      {/* ============================================================== */}
      {/* TAB CONTENT: DELIVERY ADDRESS (BUYERS ONLY)                    */}
      {/* ============================================================== */}
      {!isArtist && activeTab === 'shipping' && (
        <div className="rounded-3xl border border-white/10 bg-[#121826] p-8 shadow-xl">
          <h2 className="font-serif text-xl font-bold text-white mb-2">Saved Delivery Address</h2>
          <p className="text-xs text-slate-400 mb-6">
            This address will be pre-filled when you purchase original physical artworks for safe white-glove courier delivery.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Primary Delivery Address
            </span>
            <p className="text-sm text-white font-medium">
              {profile.address ? profile.address : 'No delivery address saved yet.'}
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/settings"
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition"
            >
              Update Address in Settings →
            </Link>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* COLLECTOR INVITATION TO BECOME AN ARTIST                       */}
      {/* ============================================================== */}
      {!isArtist && (
        <div className="mt-12 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#121826] to-purple-500/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider border border-amber-500/30">
              Creator Program
            </span>
            <h3 className="font-serif text-xl font-bold text-white mt-2">
              Are you an independent artist or sculptor?
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              You can upgrade your account to an Artist Atelier to list original artworks, get featured in curated galleries, and receive direct 90% payouts to your UPI ID.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-5 py-2.5 text-xs font-bold text-amber-300 transition"
          >
            Apply for Artist Atelier in Settings →
          </Link>
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
