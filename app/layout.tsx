import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Artelio | Original Art & Contemporary Curations',
  description:
    'Discover and acquire original artworks directly from independent artists, paired with generative AI spatial visualization and interior styling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${cormorant.variable} relative flex min-h-screen flex-col font-body bg-canvas text-ink antialiased`}>
        {/* Artistic "ARTELIO" Background Typographic Watermark Overlay */}
        <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around opacity-[0.032]" aria-hidden="true">
          <div className="font-serif whitespace-nowrap text-[12vw] font-bold tracking-[0.25em] text-ink -rotate-12 -translate-x-12 translate-y-[-4vw] leading-none">
            ARTELIO · FINE ART · ATELIER · ARTELIO
          </div>
          <div className="font-serif whitespace-nowrap text-[14vw] font-extrabold tracking-[0.3em] text-ink -rotate-12 translate-x-[-4vw] leading-none">
            ARTELIO · CONTEMPORARY · ARTELIO
          </div>
          <div className="font-serif whitespace-nowrap text-[12vw] font-bold tracking-[0.25em] text-ink -rotate-12 translate-x-[-12vw] translate-y-[4vw] leading-none">
            ATELIER · ORIGINAL GALLERY · ARTELIO
          </div>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
