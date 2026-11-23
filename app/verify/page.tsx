'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type VerificationResult = {
  verified: boolean;
  matchConfidence?: number;
  computedHash?: string;
  message?: string;
  artwork?: {
    id: string;
    title: string;
    medium: string;
    price: number;
    imageUrl: string;
    isDigital: boolean;
    isAiAssisted: boolean;
    registeredAt: string;
    artistName: string;
    artistVerified: boolean;
    imageHash: string;
  };
};

export default function VerifyProvenancePage() {
  const [activeTab, setActiveTab] = useState<'id' | 'image'>('id');
  const [textQuery, setTextQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleTextSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!textQuery.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Verification query failed.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to Artelio Provenance Registry.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Image hash verification failed.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMsg('Failed to analyze image fingerprint.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      setFilePreview(URL.createObjectURL(f));
      setResult(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#17223B] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#17223B] px-4 py-1 text-xs font-bold text-white shadow-xs">
            <span>🛡️ Public Provenance Registry</span>
            <span className="text-[10px] bg-[#F83758] text-white px-2 py-0.5 rounded-full">Artelio Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-[#17223B]">
            Verify Artwork Authenticity
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6B67] max-w-2xl mx-auto leading-relaxed">
            Every artwork on Artelio is cryptographically fingerprinted with perceptual hashing (dHash) and recorded with immutable timestamping. Check any piece to confirm creator identity, provenance history, and zero-custody guarantees.
          </p>
        </div>

        {/* Verification Card */}
        <div className="rounded-3xl border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-stylish-card">
          {/* Method Selector */}
          <div className="flex border-b border-[#F0ECE6] pb-4 mb-6 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('id');
                setResult(null);
                setErrorMsg('');
              }}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                activeTab === 'id'
                  ? 'bg-[#17223B] text-white shadow-xs'
                  : 'text-[#6E6B67] hover:text-[#17223B] hover:bg-[#FAF9F6]'
              }`}
            >
              🔍 Verify by Artwork ID / Title
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('image');
                setResult(null);
                setErrorMsg('');
              }}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                activeTab === 'image'
                  ? 'bg-[#17223B] text-white shadow-xs'
                  : 'text-[#6E6B67] hover:text-[#17223B] hover:bg-[#FAF9F6]'
              }`}
            >
              🖼️ Verify by Image Fingerprint (dHash)
            </button>
          </div>

          {/* Form 1: Text / ID Verification */}
          {activeTab === 'id' && (
            <form onSubmit={handleTextSearch} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#17223B] mb-1.5">
                  Artwork ID, Certificate Number, or Title
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder="e.g. bd09c8f6-2b0d-4dca-8557-e52eed29c8c4 or Sacred Lotus"
                    className="flex-1 rounded-xl border border-[#DEDBDB] px-4 py-3 text-xs sm:text-sm text-[#17223B] placeholder-[#A8A8A9] focus:border-[#F83758] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-[#F83758] hover:bg-[#E02244] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 disabled:opacity-60"
                  >
                    {loading ? 'Verifying Registry…' : 'Verify Authenticity'}
                  </button>
                </div>
              </label>
              <p className="text-[11px] text-[#8C8882]">
                Tip: You can paste the full Artwork ID from your Certificate of Authenticity (CoA) or receipt.
              </p>
            </form>
          )}

          {/* Form 2: Image File Fingerprint Verification */}
          {activeTab === 'image' && (
            <form onSubmit={handleFileVerification} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#17223B] mb-1.5">
                  Upload Artwork Image for Perceptual Fingerprint Matching
                </span>
                <div className="mt-1 flex justify-center rounded-2xl border-2 border-dashed border-[#DEDBDB] px-6 pt-5 pb-6 hover:border-[#F83758] transition bg-[#FAF9F6]">
                  <div className="space-y-2 text-center">
                    {filePreview ? (
                      <div className="mx-auto h-32 w-32 overflow-hidden rounded-xl border border-[#EAE6DF] shadow-xs">
                        <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF0F3] text-2xl text-[#F83758]">
                        🖼️
                      </div>
                    )}
                    <div className="text-xs text-[#6E6B67]">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer font-bold text-[#F83758] hover:underline"
                      >
                        <span>Select image file</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <span className="pl-1">or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-[#A8A8A9]">PNG, JPG, or WebP up to 10 MB</p>
                  </div>
                </div>
              </label>

              {selectedFile && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#F83758] hover:bg-[#E02244] py-3 text-xs sm:text-sm font-bold text-white shadow-stylish-btn transition active:scale-95 disabled:opacity-60"
                  >
                    {loading ? 'Computing Perceptual Hash…' : `Verify "${selectedFile.name}"`}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Verification Result Display */}
          {result && (
            <div className="mt-8 pt-6 border-t border-[#F0ECE6]">
              {result.verified && result.artwork ? (
                <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-6 sm:p-8 space-y-6">
                  {/* Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl shadow-sm">
                        ✓
                      </div>
                      <div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                          Verified Authentic Listing
                        </span>
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-[#17223B] mt-0.5">
                          Artelio Provenance Confirmed
                        </h2>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Match Confidence
                      </span>
                      <span className="text-2xl font-black text-emerald-700">{result.matchConfidence}%</span>
                    </div>
                  </div>

                  {/* Artwork Showcase */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs">
                    <img
                      src={result.artwork.imageUrl}
                      alt={result.artwork.title}
                      className="h-28 w-28 rounded-lg object-cover border border-[#DEDBDB] shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-[#17223B] truncate">
                          {result.artwork.title}
                        </span>
                        {result.artwork.artistVerified && (
                          <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                            ✓ Verified Studio
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6B67]">
                        Artist: <strong className="text-[#17223B]">{result.artwork.artistName}</strong>
                      </p>
                      <p className="text-xs text-[#6E6B67]">
                        Medium: <strong className="text-[#17223B]">{result.artwork.medium}</strong>
                      </p>
                      <p className="text-xs text-[#6E6B67]">
                        Registration Date:{' '}
                        <strong className="text-[#17223B]">
                          {new Date(result.artwork.registeredAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </p>
                      <div className="pt-1">
                        <span className="inline-block rounded-md bg-[#FAF9F6] border border-[#EAE6DF] px-2.5 py-1 text-[11px] font-mono text-[#17223B]">
                          dHash: {result.artwork.imageHash || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Curatorial & Provenance Commitments */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-white p-3.5 border border-emerald-200">
                      <span className="font-bold text-[#17223B] block">🛡️ Zero-Custody Protection</span>
                      <span className="text-[#6E6B67] text-[11px] mt-0.5 block">
                        Original master file safely retained in author&apos;s custody.
                      </span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-emerald-200">
                      <span className="font-bold text-[#17223B] block">📜 Certificate of Authenticity</span>
                      <span className="text-[#6E6B67] text-[11px] mt-0.5 block">
                        Serialized archival record with physical &amp; digital CoA issuance.
                      </span>
                    </div>
                    <div className="rounded-xl bg-white p-3.5 border border-emerald-200">
                      <span className="font-bold text-[#17223B] block">⚡ 90% Fair-Trade Split</span>
                      <span className="text-[#6E6B67] text-[11px] mt-0.5 block">
                        Creator receives 90% direct payout via Razorpay escrow.
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/artwork/${result.artwork.id}`}
                      className="rounded-xl bg-[#17223B] hover:bg-[#F83758] px-6 py-2.5 text-xs font-bold text-white transition shadow-xs"
                    >
                      View Artwork Listing in Gallery →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
                  <div className="text-3xl">⚠️</div>
                  <h3 className="font-bold text-sm text-[#17223B]">No Provenance Match Found</h3>
                  <p className="text-xs text-[#6E6B67] max-w-md mx-auto">
                    {result.message ||
                      'This image or ID does not match any authenticated listing in the Artelio Provenance Registry.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informational Guidance matching ES Report */}
        <div className="mt-12 rounded-3xl border border-[#EAE6DF] bg-white p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-serif font-black text-[#17223B]">
            How Artelio Protects Artists &amp; Collectors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#6E6B67] leading-relaxed">
            <div>
              <h3 className="font-bold text-sm text-[#17223B] mb-1">1. Zero-Custody &amp; Watermarked Previews</h3>
              <p>
                Digital artists frequently risk art theft and unauthorized AI scraping when publishing original files. Artelio only stores low-resolution watermarked previews on the public web. Full-resolution originals remain strictly with the artist until an authenticated purchase is completed.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#17223B] mb-1">2. Perceptual Cryptographic Fingerprinting</h3>
              <p>
                Each artwork thumbnail carries a 64-bit difference hash (dHash) and timestamping that permanently associates the artist with their work. Even if an image is resized or re-compressed, Artelio spot-checks duplicate attempts to prevent unauthorized re-listings.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#17223B] mb-1">3. Escrow &amp; Guaranteed 90/10 Split</h3>
              <p>
                Traditional art platforms deduct 40% to 50% from living creators. Artelio guarantees a 90% direct payout to the artist, while holding buyer funds in secure escrow until delivery is verified.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#17223B] mb-1">4. Public Transparency &amp; Provenance Portal</h3>
              <p>
                Anyone — collectors, auction houses, or other creators — can access this open portal to verify provenance and confirm that an artwork was genuinely minted and cataloged by the credited studio master.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
