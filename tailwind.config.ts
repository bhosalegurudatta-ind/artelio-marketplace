import type { Config } from 'tailwindcss';

// Storefront palette. The original token names (ink, paper, indigo, clay, marigold)
// are kept so the pages that were not redesigned (login, signup, dashboard,
// checkout) pick up the new look automatically.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#16233B',       // dark navy for text and dark buttons
        paper: '#F5F7FA',     // light grey for image tiles and the top strip
        brand: '#0E8ACF',     // primary blue
        'brand-dark': '#0A6EA5',
        'brand-soft': '#E8F4FB',
        indigo: '#0A6EA5',    // hover colour used by older pages
        clay: '#D63F2A',      // errors and required marks
        marigold: '#F4B63D',
        malachite: '#1F8A70', // small accent text, e.g. the medium on a card
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
