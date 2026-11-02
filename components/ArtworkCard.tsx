import Link from 'next/link';
import FavoriteButton from './FavoriteButton';

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
};

export function artworkImageStyle(a: Artwork): React.CSSProperties | null {
  if (a.imageUrl) return { background: `url("${a.imageUrl}") center/cover` };
  if (a.imageColor && a.imageColor.startsWith('url(')) return { background: a.imageColor };
  return null;
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const imageStyle = artworkImageStyle(artwork);

  // Nykaa-style discount / original price presentation
  const originalPrice = Math.round(Number(artwork.price) * 1.25);
  const discountPercent = 20;

  return (
    <div className="group relative rounded-xl border border-[#E8E8E8] bg-white overflow-hidden shadow-nykaa-sm hover:shadow-nykaa-hover transition-all duration-300 flex flex-col justify-between">
      <Link href={`/artwork/${artwork.id}`} className="block">
        {/* Product Image Area with Nykaa-style Badges */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden bg-[#F7F7F7]"
          style={imageStyle ?? undefined}
        >
          {!imageStyle && (
            <div className="flex h-full w-full items-center justify-center text-4xl bg-[#FFF0F5] text-[#FC2779]">
              🎨
            </div>
          )}

          {/* Nykaa Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className="rounded bg-[#FC2779] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              ✦ Certified Original
            </span>
            <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
              Direct from Artist
            </span>
          </div>

          {/* Quick Preview Hover Overlay */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Wishlist Button (Nykaa Top-Right Floating Heart) */}
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton artworkId={artwork.id} />
      </div>

      {/* Product Details Section (Nykaa Style) */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Artist Brand Tag */}
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#FC2779] transition block truncate">
            {artwork.artist || 'Independent Atelier'}
          </span>

          {/* Artwork Title */}
          <Link href={`/artwork/${artwork.id}`}>
            <h3 className="font-sans font-bold text-sm text-[#1A1A1A] line-clamp-1 mt-0.5 hover:text-[#FC2779] transition">
              {artwork.title}
            </h3>
          </Link>

          {/* Medium Specification */}
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {artwork.medium || 'Fine Art Pigment on Canvas'}
          </p>
        </div>

        {/* Pricing Block with Nykaa Discount Layout */}
        <div className="mt-3 pt-2.5 border-t border-[#F0F0F0]">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-[#1A1A1A]">
              ₹{artwork.price?.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-[#FC2779]">
              {discountPercent}% Off
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-600 font-semibold">
            <span>✓ Verified Authenticity (COA)</span>
            <span className="text-gray-400">Free Shipping</span>
          </div>

          {/* View & Acquire CTA Button */}
          <Link
            href={`/artwork/${artwork.id}`}
            className="mt-3 block w-full rounded bg-[#FFF0F5] hover:bg-[#FC2779] text-[#FC2779] hover:text-white py-2 text-center text-xs font-bold transition shadow-xs active:scale-[0.99]"
          >
            View Artwork Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
