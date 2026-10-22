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
        ink: '#F8FAFC',       // crisp gallery off-white text
        paper: '#121826',     // dark obsidian atelier surface
        canvas: '#0B0F19',    // professional midnight museum gallery background
        brand: '#6366F1',     // vibrant atelier iris / royal lapis
        'brand-dark': '#4F46E5',
        'brand-soft': '#1E1B4B',
        indigo: '#6366F1',    // hover colour used by older pages
        clay: '#FF4D36',      // rich vermilion for errors and badges
        marigold: '#F59E0B',  // warm cadmium gold
        malachite: '#10B981', // vibrant verdigris emerald
        vermilion: '#FF4D36',
        amethyst: '#8B5CF6',
        magenta: '#EC4899',
        cerulean: '#0EA5E9',
        amber: '#F59E0B',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'paint-spectrum': 'linear-gradient(135deg, #FF4D36 0%, #F59E0B 25%, #10B981 50%, #0EA5E9 75%, #8B5CF6 100%)',
        'aurora-glow': 'linear-gradient(120deg, #6366F1 0%, #EC4899 50%, #F59E0B 100%)',
        'atelier-dark': 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #18181B 100%)',
      },
      boxShadow: {
        'art-card': '0 10px 30px -10px rgba(99, 102, 241, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        'art-glow': '0 0 25px -5px rgba(244, 63, 94, 0.25), 0 0 15px -3px rgba(99, 102, 241, 0.25)',
        'gold-glow': '0 10px 25px -5px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
