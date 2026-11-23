import Link from 'next/link';
import FavoriteButton from './FavoriteButton';
import VerifiedBadge from './VerifiedBadge';

export type Artwork = {
  id: string;
  title: string;
  artist: string;
  price: number;
  medium: string;
  imageColor?: string;
  imageUrl?: string | null;
  createdAt?: string | null;
  artistId?: string | null;
  isPromoted?: boolean;
  artistVerified?: boolean;
  isAiAssisted?: boolean;
  isDigital?: boolean;
};

export function artworkImageStyle(a: Artwork): React.CSSProperties | null {
  if (a.imageUrl) return { background: `url("${a.imageUrl}") center/cover` };
  if (a.imageColor && a.imageColor.startsWith('url(')) return { background: a.imageColor };
  return null;
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const imageStyle = artworkImageStyle(artwork);

  const rating = 4.8;
  const ratingCount = 1240;

  return (
    <div className="group relative rounded-xl border border-[#E8E8E8] bg-white overflow-hidden shadow-xs hover:shadow-stylish-card transition-all duration-200 flex flex-col justify-between">
      <Link href={`/artwork/${artwork.id}`} className="block">
        {/* Product Image Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#F9F9F9]">
          {artwork.imageUrl ? (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              loading="lazy"
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/artworks/modern-abstract-gallery-wall-poster.jpg';
              }}
            />
          ) : imageStyle ? (
            <div className="h-full w-full" style={imageStyle} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl bg-[#FDF0F3] text-[#F83758]">
              🎨
            </div>
          )}

          {/* Top-Left Format & Creation Badge (Physical vs Digital, Original vs AI) */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
            {artwork.price === 0 && (
              <span className="rounded bg-[#F83758] px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs tracking-wider uppercase">
                ✏️ Custom Sketch
              </span>
            )}
            {(artwork.title?.toLowerCase().includes('stick') || artwork.title?.toLowerCase().includes('poster') || artwork.medium?.toLowerCase().includes('stick') || artwork.medium?.toLowerCase().includes('poster')) && (
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs tracking-wider uppercase flex items-center gap-1">
                🖼️ Wall Art / Poster
              </span>
            )}
            {artwork.isPromoted && (
              <span className="rounded bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-xs tracking-wider flex items-center gap-1 border border-amber-300/40">
                <span className="text-[9px]">★</span> Featured
              </span>
            )}
            <span className="rounded bg-[#17223B]/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
              {artwork.isDigital ? '💾 Digital' : '📦 Physical Artwork'}
            </span>
            <span className="rounded bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
              {artwork.isAiAssisted ? '✨ AI-Assisted' : '🖌️ Original Handcrafted'}
            </span>
          </div>

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Floating Wishlist Heart Icon */}
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton artworkId={artwork.id} />
      </div>

      {/* Product Details */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Title */}
          <Link href={`/artwork/${artwork.id}`}>
            <h3 className="font-sans font-bold text-sm text-[#17223B] line-clamp-1 hover:text-[#F83758] transition">
              {artwork.title}
            </h3>
          </Link>

          {/* Subtitle / Artist */}
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-xs text-[#626262] line-clamp-1">
              {artwork.artist || 'Independent Artist'}
            </span>
            {artwork.artistVerified && <VerifiedBadge size="xs" />}
            <span className="text-xs text-[#626262]">• {artwork.medium || 'Fine Art'}</span>
          </div>

          {/* Genuine Artist Price (or Custom Commission) */}
          <div className="mt-2 flex items-baseline gap-2">
            {artwork.price > 0 ? (
              <span className="text-base font-black text-[#17223B]">
                ₹{artwork.price?.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-xs font-black text-[#F83758] bg-[#FDF0F3] border border-[#F83758]/20 px-2 py-0.5 rounded-full">
                ✏️ Customised Sketch • Price on Request
              </span>
            )}
          </div>

          {/* Star Rating Stars */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#F9A825]">
            <span className="tracking-tighter">★★★★★</span>
            <span className="text-[10px] text-[#A8A8A9] font-medium">
              Verified Atelier
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
          {artwork.price > 0 ? (
            <Link
              href={`/checkout/${artwork.id}`}
              className="flex-1 rounded-md bg-[#F83758] hover:bg-[#E02244] text-white py-1.5 text-center text-xs font-bold transition shadow-xs active:scale-[0.98] uppercase tracking-wide"
            >
              Buy Now
            </Link>
          ) : (
            <Link
              href={`/artwork/${artwork.id}`}
              className="flex-1 rounded-md bg-[#17223B] hover:bg-[#F83758] text-white py-1.5 text-center text-xs font-bold transition shadow-xs active:scale-[0.98] tracking-wide"
            >
              Request Custom Sketch
            </Link>
          )}

          <Link
            href={`/artwork/${artwork.id}`}
            className="px-2.5 py-1.5 rounded-md border border-[#DEDBDB] hover:border-[#F83758] text-[#17223B] hover:text-[#F83758] text-xs font-bold transition bg-white"
            title="View Details"
          >
            👁
          </Link>
        </div>
      </div>
    </div>
  );
}
