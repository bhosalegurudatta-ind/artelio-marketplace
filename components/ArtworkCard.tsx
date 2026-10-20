import Link from 'next/link';
import GenerativeArt from './GenerativeArt';
import FavoriteButton from './FavoriteButton';

export type Artwork = {
  id: string;
  title: string;
  artist: string;
  price: number;
  medium: string;
  // Older pages pass `imageColor` (a CSS background string); newer code passes `imageUrl`.
  imageColor?: string;
  imageUrl?: string | null;
  createdAt?: string | null;
  artistId?: string | null;
};

// Returns the CSS for a real photo, or null if the artwork has none
// (in which case the caller shows generated art instead).
export function artworkImageStyle(a: Artwork): React.CSSProperties | null {
  if (a.imageUrl) return { background: `url("${a.imageUrl}") center/cover` };
  if (a.imageColor && a.imageColor.startsWith('url(')) return { background: a.imageColor };
  return null;
}

function isNew(createdAt?: string | null) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const imageStyle = artworkImageStyle(artwork);

  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block rounded-2xl border border-ink/[0.07] bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Image area */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-paper"
        style={imageStyle ?? undefined}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        <FavoriteButton artworkId={artwork.id} />

        {!imageStyle && <GenerativeArt seed={artwork.id} className="block h-full w-full transition-transform duration-500 group-hover:scale-105" />}

        {/* Zoom effect on real images */}
        {imageStyle && (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={imageStyle}
          />
        )}

        {/* "New" badge */}
        {isNew(artwork.createdAt) && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand shadow-sm uppercase">
            ✦ New
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="px-3 py-3">
        <h3 className="truncate text-sm font-semibold text-ink leading-tight">{artwork.title}</h3>
        <p className="mt-0.5 truncate text-[11px] text-ink/50 tracking-wide">by {artwork.artist}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-ink tracking-tight">
            ₹{artwork.price.toLocaleString('en-IN')}
          </span>
          {artwork.medium && (
            <span className="shrink-0 truncate rounded-full bg-brand/8 px-2 py-0.5 text-[10px] font-semibold text-brand/80 uppercase tracking-wide">
              {artwork.medium}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
