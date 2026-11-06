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

  // Exact Figma "Stylish" pricing format
  const originalPrice = Math.round(Number(artwork.price) * 1.4);
  const discountPercent = 40;
  const rating = 4.5;
  const ratingCount = 56890;

  return (
    <div className="group relative rounded-xl border border-[#E8E8E8] bg-white overflow-hidden shadow-xs hover:shadow-stylish-card transition-all duration-200 flex flex-col justify-between">
      <Link href={`/artwork/${artwork.id}`} className="block">
        {/* Product Image Area */}
        <div
          className="relative aspect-square w-full overflow-hidden bg-[#F9F9F9]"
          style={imageStyle ?? undefined}
        >
          {!imageStyle && (
            <div className="flex h-full w-full items-center justify-center text-4xl bg-[#FDF0F3] text-[#F83758]">
              🎨
            </div>
          )}

          {/* Top-Left Discount / Deal Pill */}
          <div className="absolute top-2 left-2 z-10">
            <span className="rounded bg-[#F83758] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-xs">
              40% OFF
            </span>
          </div>

          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Floating Wishlist Heart Icon (Figma Kit placement) */}
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton artworkId={artwork.id} />
      </div>

      {/* Product Details (Figma Card Layout) */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Title */}
          <Link href={`/artwork/${artwork.id}`}>
            <h3 className="font-sans font-bold text-sm text-[#17223B] line-clamp-1 hover:text-[#F83758] transition">
              {artwork.title}
            </h3>
          </Link>

          {/* Subtitle / Artist */}
          <p className="text-xs text-[#626262] line-clamp-1 mt-0.5">
            {artwork.artist || 'Independent Artist'} • {artwork.medium || 'Fine Art'}
          </p>

          {/* Price Block (Figma "Stylish" row) */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-[#17223B]">
              ₹{artwork.price?.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[#A8A8A9] line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-[#F83758]">
              {discountPercent}% Off
            </span>
          </div>

          {/* Star Rating Stars (Figma exact format: ★★★★★ 56,890) */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#F9A825]">
            <span className="tracking-tighter">★★★★☆</span>
            <span className="text-[10px] text-[#A8A8A9] font-medium">
              {ratingCount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
          <Link
            href={`/checkout/${artwork.id}`}
            className="flex-1 rounded-md bg-[#F83758] hover:bg-[#E02244] text-white py-1.5 text-center text-xs font-bold transition shadow-xs active:scale-[0.98] uppercase tracking-wide"
          >
            Buy Now
          </Link>

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
