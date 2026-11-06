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

  // Nykaa-style discount pricing calculation
  const originalPrice = Math.round(Number(artwork.price) * 1.25);
  const discountPercent = 20;

  // Realistic rating for e-commerce credibility
  const rating = 4.8;
  const ratingCount = 142;

  return (
    <div className="group relative rounded-xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs hover:shadow-nykaa-hover transition-all duration-300 flex flex-col justify-between">
      <Link href={`/artwork/${artwork.id}`} className="block">
        {/* Product Image Area with Nykaa-style Badges */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden bg-[#F8F8F8]"
          style={imageStyle ?? undefined}
        >
          {!imageStyle && (
            <div className="flex h-full w-full items-center justify-center text-4xl bg-[#FFF0F5] text-[#FC2779]">
              🎨
            </div>
          )}

          {/* Top-Left Nykaa Trust Badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span className="rounded bg-[#FC2779] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              ✦ Certified Original
            </span>
            <span className="rounded bg-black/75 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow-xs backdrop-blur-xs">
              Free Delivery
            </span>
          </div>

          {/* Quick Preview Hover Overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Wishlist Button (Nykaa Floating Heart Top-Right) */}
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton artworkId={artwork.id} />
      </div>

      {/* Product Details Section (Nykaa App Card Format) */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Brand/Artist Tag */}
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
            {artwork.medium || 'Original Fine Art on Canvas'}
          </p>

          {/* Nykaa Rating Stars Pill */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 bg-[#F5F5F5] border border-gray-200 text-[#1A1A1A] text-[10px] font-bold px-1.5 py-0.5 rounded">
              <span>{rating}</span>
              <span className="text-[#FC2779] text-xs">★</span>
            </span>
            <span className="text-[10px] text-gray-400">({ratingCount})</span>
          </div>
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

          {/* Bottom Nykaa Button */}
          <div className="mt-2.5 flex items-center gap-2">
            <Link
              href={`/checkout/${artwork.id}`}
              className="flex-1 rounded-md bg-[#FC2779] hover:bg-[#D81B60] text-white py-2 text-center text-xs font-bold transition shadow-xs active:scale-[0.98] uppercase tracking-wide"
            >
              Buy Now
            </Link>

            <Link
              href={`/artwork/${artwork.id}`}
              className="px-2.5 py-2 rounded-md border border-[#E0E0E0] hover:border-[#FC2779] text-gray-700 hover:text-[#FC2779] text-xs font-bold transition bg-white"
              title="View Artwork Details"
            >
              👁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
