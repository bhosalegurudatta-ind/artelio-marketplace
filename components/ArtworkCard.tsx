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

function mediumColorClass(medium: string) {
  const m = (medium || '').toLowerCase();
  if (m.includes('oil') || m.includes('acrylic')) return 'bg-amber-50 text-amber-800 border-amber-200/60';
  if (m.includes('water') || m.includes('gouache')) return 'bg-sky-50 text-sky-800 border-sky-200/60';
  if (m.includes('digital') || m.includes('vector')) return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200/60';
  if (m.includes('sketch') || m.includes('draw') || m.includes('charcoal')) return 'bg-slate-100 text-slate-800 border-slate-200';
  if (m.includes('photo')) return 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
  if (m.includes('sculpt') || m.includes('clay')) return 'bg-orange-50 text-orange-800 border-orange-200/60';
  return 'bg-purple-50 text-purple-800 border-purple-200/60';
}

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const imageStyle = artworkImageStyle(artwork);

  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block rounded-2xl border border-black/[0.08] bg-white art-card-hover overflow-hidden relative shadow-sm"
    >
      {/* Image area */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-[#F3EFE6]"
        style={imageStyle ?? undefined}
      >
        {/* Subtle vignette hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <FavoriteButton artworkId={artwork.id} />

        {!imageStyle && (
          <GenerativeArt
            seed={artwork.id}
            className="block h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Zoom effect on real images */}
        {imageStyle && (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={imageStyle}
          />
        )}

        {/* "New" badge */}
        {isNew(artwork.createdAt) && (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-vermilion shadow-sm uppercase border border-vermilion/20">
            ✦ New Original
          </span>
        )}
      </div>

      {/* Card body with gallery aesthetics */}
      <div className="p-3.5 bg-white">
        <h3 className="truncate font-serif text-base font-semibold text-ink leading-snug group-hover:text-brand transition-colors">
          {artwork.title}
        </h3>
        <p className="mt-1 truncate text-xs text-ink/65 flex items-center gap-1 font-medium">
          <span className="text-[10px] text-amber-500">🖌️</span>
          <span>{artwork.artist}</span>
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04]">
          <span className="font-serif text-lg font-bold text-ink tracking-tight">
            ₹{artwork.price.toLocaleString('en-IN')}
          </span>
          {artwork.medium && (
            <span
              className={`shrink-0 truncate rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${mediumColorClass(
                artwork.medium
              )}`}
            >
              {artwork.medium}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
