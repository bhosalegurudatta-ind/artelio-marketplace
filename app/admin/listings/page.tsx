'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import AdminNav from '@/components/AdminNav';

type ArtworkListing = {
  id: string;
  title: string;
  description: string | null;
  medium: string;
  price: number;
  image_url: string;
  sold: boolean;
  is_digital: boolean;
  is_hidden: boolean;
  takedown_reason: string | null;
  created_at: string;
  artist_id: string;
  users?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function AdminListingsPage() {
  const [artworks, setArtworks] = useState<ArtworkListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state for taking down a listing
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkListing | null>(null);
  const [takedownReason, setTakedownReason] = useState('Violates marketplace listing guidelines');

  async function loadListings(queryStr: string = '') {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Authentication token missing. Please sign in as an admin.');
        setLoading(false);
        return;
      }

      const url = queryStr.trim()
        ? `/api/admin/listings?q=${encodeURIComponent(queryStr.trim())}`
        : '/api/admin/listings';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to load listings.');
      } else {
        setArtworks(data.artworks || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with listings API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadListings(searchQuery);
  }

  function openTakedownDialog(art: ArtworkListing) {
    setSelectedArtwork(art);
    setTakedownReason('Violates marketplace listing guidelines');
    setTakedownModalOpen(true);
  }

  async function confirmTakedown() {
    if (!selectedArtwork) return;

    setActionLoading(selectedArtwork.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artworkId: selectedArtwork.id,
          isHidden: true,
          takedownReason: takedownReason.trim() || 'Violates marketplace listing guidelines',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to take down listing.');
      } else {
        setSuccessMsg(`Artwork "${selectedArtwork.title}" taken down successfully.`);
        setArtworks((prev) =>
          prev.map((a) =>
            a.id === selectedArtwork.id
              ? { ...a, is_hidden: true, takedown_reason: takedownReason.trim() }
              : a
          )
        );
        setTakedownModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing takedown.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestoreListing(art: ArtworkListing) {
    if (!window.confirm(`Restore listing "${art.title}" back to public catalog?`)) {
      return;
    }

    setActionLoading(art.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artworkId: art.id,
          isHidden: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to restore listing.');
      } else {
        setSuccessMsg(`Artwork "${art.title}" restored to active status.`);
        setArtworks((prev) =>
          prev.map((a) =>
            a.id === art.id ? { ...a, is_hidden: false, takedown_reason: null } : a
          )
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error restoring listing.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#17223B] md:text-4xl">
          Admin Portal
        </h1>
        <p className="mt-1 text-sm text-[#626262]">
          Search, audit, and moderate artwork listings across the Artelio marketplace.
        </p>
      </div>

      <AdminNav active="listings" />

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">
          {successMsg}
        </div>
      )}

      {/* Search Header */}
      <div className="mb-8 rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artworks by title, medium, or description..."
              className="w-full rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#17223B] placeholder-[#9E9E9E] focus:border-brand focus:bg-white focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-vermilion to-magenta px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadListings('');
              }}
              className="rounded-xl border border-[#DEDBDB] bg-white px-4 py-3 text-sm font-bold text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B] transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Listings Table / Cards */}
      {loading ? (
        <div className="py-20 text-center text-sm text-[#626262]">Loading listings...</div>
      ) : artworks.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-12 text-center shadow-sm">
          <p className="text-base font-bold text-[#17223B]">No listings found</p>
          <p className="mt-1 text-xs text-[#626262]">
            {searchQuery
              ? `No artwork matches "${searchQuery}". Try a different keyword.`
              : 'There are no artworks in the catalog yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
          <table className="w-full text-left text-sm text-[#17223B]">
            <thead className="border-b border-[#E8E8E8] bg-[#FAFAFA] text-xs font-bold uppercase tracking-wider text-[#626262]">
              <tr>
                <th className="px-5 py-4">Artwork</th>
                <th className="px-5 py-4">Artist</th>
                <th className="px-5 py-4">Medium</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8] font-sans">
              {artworks.map((art) => (
                <tr key={art.id} className="hover:bg-[#FAFAFA] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[#E8E8E8] bg-[#FAFAFA]">
                        {art.image_url ? (
                          <Image
                            src={art.image_url}
                            alt={art.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8E8E8E]">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <Link
                          href={`/artwork/${art.id}`}
                          target="_blank"
                          className="font-semibold text-[#17223B] hover:text-brand transition truncate block"
                          title={art.title}
                        >
                          {art.title}
                        </Link>
                        <p className="text-xs text-[#8E8E8E] truncate">
                          ID: {art.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-xs">
                      <p className="font-semibold text-[#17223B]">{art.users?.name || 'Unknown Artist'}</p>
                      <p className="text-[#626262]">{art.users?.email || 'No email'}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs capitalize text-[#626262]">
                    {art.medium}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs font-semibold text-[#17223B]">
                    ₹{Number(art.price).toLocaleString('en-IN')}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {art.is_hidden ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                          🚫 Taken Down
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                          ✓ Active
                        </span>
                      )}

                      {art.sold && (
                        <span className="inline-flex items-center rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          SOLD
                        </span>
                      )}

                      {art.is_hidden && art.takedown_reason && (
                        <p className="text-[11px] text-rose-600 max-w-xs truncate" title={art.takedown_reason}>
                          Reason: {art.takedown_reason}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/artwork/${art.id}`}
                        target="_blank"
                        className="rounded-lg border border-[#DEDBDB] bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-semibold text-[#17223B] hover:bg-[#F3F3F3] transition"
                      >
                        View
                      </Link>

                      {art.is_hidden ? (
                        <button
                          onClick={() => handleRestoreListing(art)}
                          disabled={actionLoading === art.id}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs"
                        >
                          {actionLoading === art.id ? 'Restoring...' : 'Restore'}
                        </button>
                      ) : (
                        <button
                          onClick={() => openTakedownDialog(art)}
                          disabled={actionLoading === art.id}
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-xs"
                        >
                          {actionLoading === art.id ? 'Processing...' : 'Take Down'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Takedown Modal */}
      {takedownModalOpen && selectedArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#17223B]">Take Down Listing</h2>
            <p className="mt-1 text-xs text-[#626262]">
              Taking down &ldquo;{selectedArtwork.title}&rdquo; will immediately hide it from all
              marketplace views, searches, and artist profile listings for non-admins.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#17223B] mb-1">
                  Reason for Takedown
                </label>
                <textarea
                  rows={3}
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  className="w-full rounded-xl border border-[#DEDBDB] bg-[#FAFAFA] p-3 text-sm text-[#17223B] placeholder-[#9E9E9E] focus:border-rose-500 focus:bg-white focus:outline-none"
                  placeholder="Specify violation reason (e.g. copyright infringement, fake listing, explicit material)..."
                />
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#626262] mb-1.5">Common reasons:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Copyright / IP Infringement',
                    'Misleading Description / Photo',
                    'Prohibited or Inappropriate Content',
                    'Violates marketplace listing guidelines',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTakedownReason(preset)}
                      className="rounded-lg border border-[#DEDBDB] bg-[#F3F3F3] px-2.5 py-1 text-[11px] font-semibold text-[#17223B] hover:bg-[#E8E8E8]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E8E8E8] pt-4">
              <button
                type="button"
                onClick={() => setTakedownModalOpen(false)}
                className="rounded-xl border border-[#DEDBDB] bg-white px-4 py-2 text-xs font-bold text-[#626262] hover:bg-[#F3F3F3] hover:text-[#17223B] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTakedown}
                disabled={actionLoading === selectedArtwork.id}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
              >
                {actionLoading === selectedArtwork.id ? 'Taking down...' : 'Confirm Takedown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
