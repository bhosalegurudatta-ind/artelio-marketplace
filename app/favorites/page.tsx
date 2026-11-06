'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FavoritesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/favourites');
  }, [router]);

  return (
    <div className="py-20 text-center text-xs text-[#626262]">
      Redirecting to your favourites…
    </div>
  );
}
