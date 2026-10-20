'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type RoomStylingAdvice = {
  room_style: string;
  harmony_score: number;
  wall_color_analysis: string;
  lighting_evaluation: string;
  placement_recommendation: string;
  scale_and_proportion: string;
  ideal_frame_style: string;
  designer_verdict: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  artworkTitle: string;
  artworkImageUrl: string | null;
  artworkPrice: number;
};

const FRAME_STYLES = [
  { id: 'black', label: 'Matte Black', border: 'border-[8px] border-neutral-900 shadow-2xl' },
  { id: 'oak', label: 'Warm Oak', border: 'border-[8px] border-[#9e754f] shadow-2xl' },
  { id: 'white', label: 'Pure White', border: 'border-[8px] border-white shadow-2xl' },
  { id: 'canvas', label: 'Gallery Wrap (Frameless)', border: 'border-0 shadow-2xl' },
];

export default function RoomVisualizerModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
  artworkImageUrl,
  artworkPrice,
}: Props) {
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [roomPreview, setRoomPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [styling, setStyling] = useState<RoomStylingAdvice | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Interactive Placement State
  const [frameStyle, setFrameStyle] = useState(FRAME_STYLES[0]);
  const [artScale, setArtScale] = useState(38); // percentage width
  const [artPos, setArtPos] = useState({ x: 50, y: 40 }); // percentage center
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [savingMockup, setSavingMockup] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRoomFile(null);
      setRoomPreview(null);
      setStyling(null);
      setErrorMsg('');
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoomFile(file);
    setStyling(null);
    setErrorMsg('');
    setSaveSuccess(false);
    const url = URL.createObjectURL(file);
    setRoomPreview(url);
  }

  async function handleSaveMockup() {
    if (!roomPreview || !artworkImageUrl) return;
    setSavingMockup(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Please log in to save mockups to your spaces.');
        setSavingMockup(false);
        return;
      }

      // Generate composite canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas');

      const roomImg = new Image();
      roomImg.crossOrigin = 'anonymous';
      roomImg.src = roomPreview;

      await new Promise((resolve, reject) => {
        roomImg.onload = resolve;
        roomImg.onerror = reject;
      });

      canvas.width = roomImg.naturalWidth || 1200;
      canvas.height = roomImg.naturalHeight || 900;

      // Draw background room
      ctx.drawImage(roomImg, 0, 0, canvas.width, canvas.height);

      // Load artwork image
      const artImg = new Image();
      artImg.crossOrigin = 'anonymous';
      artImg.src = artworkImageUrl;

      await new Promise((resolve, reject) => {
        artImg.onload = resolve;
        artImg.onerror = reject;
      });

      // Calculate position and size based on user's positioning
      const artWidth = (artScale / 100) * canvas.width;
      const artHeight = artWidth * (artImg.naturalHeight / artImg.naturalWidth);
      const centerX = (artPos.x / 100) * canvas.width;
      const centerY = (artPos.y / 100) * canvas.height;
      const drawX = centerX - artWidth / 2;
      const drawY = centerY - artHeight / 2;

      // Draw shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 14;

      // Draw frame background border
      const framePadding = frameStyle.id === 'canvas' ? 0 : 12;
      if (frameStyle.id === 'black') ctx.fillStyle = '#171717';
      else if (frameStyle.id === 'oak') ctx.fillStyle = '#9e754f';
      else if (frameStyle.id === 'white') ctx.fillStyle = '#ffffff';

      if (framePadding > 0) {
        ctx.fillRect(drawX - framePadding, drawY - framePadding, artWidth + framePadding * 2, artHeight + framePadding * 2);
      }

      ctx.restore();

      // Draw artwork
      ctx.drawImage(artImg, drawX, drawY, artWidth, artHeight);

      // Export composite base64
      const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.88);

      const res = await fetch('/api/spaces/save-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          artworkId,
          snapshotBase64,
          title: `${artworkTitle} in my room`,
          roomStyle: styling?.room_style || 'Curated Space',
          harmonyScore: styling?.harmony_score || 90,
          isPublic: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save mockup.');
        setSavingMockup(false);
        return;
      }

      setSaveSuccess(true);
    } catch (err: any) {
      console.error('Error saving composite mockup:', err);
      setErrorMsg(err.message || 'Could not composite room image.');
    } finally {
      setSavingMockup(false);
    }
  }

  async function handleAnalyze() {
    if (!roomFile) {
      setErrorMsg('Please upload a photo of your wall first.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg('Please log in to use the AI Room Visualizer.');
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append('roomImage', roomFile);
      form.append('artworkId', artworkId);

      const res = await fetch('/api/ai/room-visualizer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to analyze room.');
        setLoading(false);
        return;
      }

      setStyling(data.stylingAdvice);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // Interactive Dragging on the Wall
  function handleMouseDown() {
    setIsDragging(true);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));
    setArtPos({ x, y });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-ink/40 transition hover:bg-paper hover:text-ink"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-malachite text-lg text-white shadow-md">
            ✦
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink md:text-2xl">Art in Your Space Visualizer</h2>
              <span className="rounded-full bg-malachite/10 px-2.5 py-0.5 text-xs font-semibold text-malachite">
                Collector Club
              </span>
            </div>
            <p className="text-xs text-ink/60">
              Preview &ldquo;{artworkTitle}&rdquo; (₹{artworkPrice.toLocaleString('en-IN')}) to scale on your actual room wall with AI interior styling.
            </p>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Interactive Room Canvas */}
          <div className="lg:col-span-7">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl border border-ink/15 bg-neutral-100 shadow-inner"
            >
              {roomPreview ? (
                <>
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${roomPreview})` }}
                  />
                  {/* Positionable Framed Artwork */}
                  {artworkImageUrl && (
                    <div
                      onMouseDown={handleMouseDown}
                      style={{
                        position: 'absolute',
                        left: `${artPos.x}%`,
                        top: `${artPos.y}%`,
                        width: `${artScale}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                      }}
                      className={`transition-shadow ${frameStyle.border}`}
                    >
                      <img
                        src={artworkImageUrl}
                        alt={artworkTitle}
                        className="block h-auto w-full object-contain pointer-events-none"
                      />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink/75 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 hover:opacity-100 transition">
                        Drag to reposition
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-ink/60">
                  <span className="text-3xl mb-2">🖼️</span>
                  <p className="text-sm font-semibold text-ink">Upload a photo of your wall or room</p>
                  <p className="mt-1 max-w-xs text-xs text-ink/60">
                    Snap a picture of your living room, bedroom, or office wall to see how this artwork complements your interior decor.
                  </p>
                  <label className="mt-4 cursor-pointer rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-dark">
                    <span>Select Room Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Interactive Controls if Photo Uploaded */}
            {roomPreview && (
              <div className="mt-4 space-y-3 rounded-2xl bg-paper p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="cursor-pointer text-xs font-semibold text-brand hover:underline">
                    Change Room Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-ink/60">Size Scale:</span>
                    <input
                      type="range"
                      min="20"
                      max="65"
                      value={artScale}
                      onChange={(e) => setArtScale(Number(e.target.value))}
                      className="w-24 accent-brand"
                    />
                  </div>
                </div>

                {/* Frame Style Selectors */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10">
                  <span className="text-ink/60">Frame Style:</span>
                  {FRAME_STYLES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFrameStyle(f)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        frameStyle.id === f.id
                          ? 'bg-ink text-white'
                          : 'bg-white text-ink/80 hover:bg-ink/5 border border-ink/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-50"
                  >
                    {loading ? 'AI is analyzing…' : '✦ AI Compatibility Analysis'}
                  </button>

                  <button
                    onClick={handleSaveMockup}
                    disabled={savingMockup}
                    className="flex-1 rounded-xl border border-brand/40 bg-brand/5 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
                  >
                    {savingMockup ? 'Saving snapshot…' : saveSuccess ? '✓ Saved to My Spaces' : '📸 Save to My Spaces'}
                  </button>
                </div>

                {saveSuccess && (
                  <p className="text-center text-xs font-medium text-malachite">
                    ✓ Space saved! <a href="/spaces" className="underline font-bold">View in Collector Spaces</a>
                  </p>
                )}
                {errorMsg && <p className="text-center text-xs text-clay">{errorMsg}</p>}
              </div>
            )}
          </div>

          {/* AI Styling Intelligence Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            {!styling && !loading && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 p-6 text-center text-ink/60">
                <span className="text-2xl mb-1">✨</span>
                <p className="text-sm font-semibold text-ink">AI Interior Harmony</p>
                <p className="mt-1 text-xs opacity-80">
                  Upload your room photo and click &ldquo;Run AI Interior Compatibility Analysis&rdquo; to receive architectural placement advice, color synergy, and lighting tips.
                </p>

                <div className="mt-6 rounded-xl border border-malachite/30 bg-malachite/5 p-4 text-left text-xs">
                  <p className="font-bold text-malachite">Collector Club Benefit</p>
                  <p className="mt-1 text-ink/70">
                    Never regret an art purchase. Our Gemini vision model assesses wall undertones, room scale, and lighting conditions to guarantee a museum-quality fit.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl bg-paper/50 p-6 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-ink">Evaluating Wall & Lighting Dynamics…</p>
                <p className="mt-1 text-xs text-ink/60">Gemini is checking room architecture, color palette balance, and optimal eye-level coordinates.</p>
              </div>
            )}

            {styling && (
              <div className="space-y-4">
                {/* Score & Style */}
                <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">Detected Room Style</p>
                      <p className="text-base font-bold text-ink">{styling.room_style}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-malachite/15 px-3 py-1 text-xs font-bold text-malachite">
                        {styling.harmony_score}% Match
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs italic text-ink/80">&ldquo;{styling.designer_verdict}&rdquo;</p>
                </div>

                {/* Detailed Advice */}
                <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper/60 p-4 text-xs">
                  <div>
                    <span className="font-bold text-ink">Wall Color Synergy:</span>
                    <p className="mt-0.5 text-ink/80">{styling.wall_color_analysis}</p>
                  </div>

                  <div>
                    <span className="font-bold text-ink">Placement & Height:</span>
                    <p className="mt-0.5 text-ink/80">{styling.placement_recommendation}</p>
                  </div>

                  <div>
                    <span className="font-bold text-ink">Lighting & Ambiance:</span>
                    <p className="mt-0.5 text-ink/80">{styling.lighting_evaluation}</p>
                  </div>

                  <div>
                    <span className="font-bold text-ink">Recommended Frame:</span>
                    <p className="mt-0.5 text-ink/80">{styling.ideal_frame_style}</p>
                  </div>
                </div>

                {/* Purchase CTA */}
                <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-ink">Love how it looks?</p>
                    <p className="text-[11px] text-ink/60">Secure this original before it sells.</p>
                  </div>
                  <a
                    href={`/checkout/${artworkId}`}
                    className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-white shadow hover:bg-brand-dark"
                  >
                    Buy this piece (₹{artworkPrice.toLocaleString('en-IN')})
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
