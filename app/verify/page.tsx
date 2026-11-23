'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyProvenancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/browse');
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-5 py-24 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F83758] border-r-transparent" />
    </main>
  );
}
