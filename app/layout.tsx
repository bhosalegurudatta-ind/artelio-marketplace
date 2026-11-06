import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppConcierge from '@/components/WhatsAppConcierge';
import MobileBottomNav from '@/components/MobileBottomNav';

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
  title: 'Artelio | India’s Premier Art & Fine Living Destination',
  description:
    'Discover authentic original paintings, sculptures, and curated masterworks directly from independent artist ateliers. 100% authentic with Certificates of Authenticity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${cormorant.variable} relative flex min-h-screen flex-col font-body bg-[#FAFAFA] text-[#1A1A1A] antialiased selection:bg-[#FCE4EC] selection:text-[#D81B60] pb-14 md:pb-0`}>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          <WhatsAppConcierge />
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
