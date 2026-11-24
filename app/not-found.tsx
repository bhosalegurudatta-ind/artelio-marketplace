import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF0F3] text-4xl text-[#F83758] mb-6 shadow-sm">
        🎨
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-[#F83758]">
        404 • Page Not Found
      </span>
      <h1 className="mt-2 text-2xl font-black text-[#17223B] sm:text-3xl">
        Looking for Beautiful Art?
      </h1>
      <p className="mt-3 text-xs sm:text-sm text-[#626262] leading-relaxed max-w-md">
        The link you followed may have moved or is temporarily unavailable. Browse our curated original artworks directly from independent artist ateliers.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/browse"
          className="rounded-full bg-[#F83758] hover:bg-[#E02244] px-6 py-2.5 text-xs font-bold text-white shadow-stylish-btn transition active:scale-95"
        >
          Explore Original Artworks →
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[#DEDBDB] bg-white hover:bg-gray-50 px-6 py-2.5 text-xs font-bold text-[#17223B] transition"
        >
          ← Return to Home
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-4 text-xs font-semibold text-[#626262]">
        <Link href="/browse?category=customised-sketches" className="hover:text-[#F83758] transition">
          ✏️ Custom Sketches
        </Link>
        <span>•</span>
        <Link href="/browse?category=crafts" className="hover:text-[#F83758] transition">
          ✨ Handcrafted Decor
        </Link>
        <span>•</span>
        <Link href="/spaces" className="hover:text-[#F83758] transition">
          🛋️ 3D Studio
        </Link>
      </div>
    </main>
  );
}
