import Link from 'next/link';
import Image from 'next/image';
import VerifiedBadge from './VerifiedBadge';

export type ArtistCardProps = {
  id: string;
  name: string;
  bio?: string | null;
  shop_name?: string | null;
  banner_url?: string | null;
  verified?: boolean;
  artworkCount?: number;
};

export default function ArtistCard({ artist }: { artist: ArtistCardProps }) {
  const displayName = artist.shop_name || artist.name;

  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121826] p-4 text-white shadow-sm hover:border-brand/40 hover:shadow-art-glow transition-all"
    >
      {/* Banner / Avatar Header */}
      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#1C0A36] via-[#43105C] to-[#120726]">
        {artist.banner_url && (
          <Image
            src={artist.banner_url}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        )}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-serif text-base font-bold text-white group-hover:text-brand-soft transition">
              {displayName}
            </h3>
            {artist.verified && <VerifiedBadge size="xs" />}
          </div>
          {artist.shop_name && artist.name && artist.shop_name !== artist.name && (
            <p className="text-xs text-white/50">By {artist.name}</p>
          )}
        </div>
      </div>

      {artist.bio && (
        <p className="mt-2 text-xs text-white/70 line-clamp-2 leading-relaxed">
          {artist.bio}
        </p>
      )}

      {typeof artist.artworkCount === 'number' && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
          <span>{artist.artworkCount} {artist.artworkCount === 1 ? 'Artwork' : 'Artworks'}</span>
          <span className="text-brand font-semibold group-hover:underline">Visit Shop →</span>
        </div>
      )}
    </Link>
  );
}
