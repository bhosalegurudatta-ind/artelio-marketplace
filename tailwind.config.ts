import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nykaa signature palette
        nykaa: {
          pink: '#FC2779',         // Iconic Nykaa Hot Pink
          darkpink: '#D81B60',     // Deep Raspberry Pink for active/hover
          lightpink: '#FFF0F5',    // Soft Lavender Blush
          softpink: '#FCE4EC',     // Pastel Rose
          gold: '#C5A059',         // Nykaa Luxe Metallic Gold
          charcoal: '#1A1A1A',     // High-contrast primary text
          gray: '#5C5C5C',         // Secondary body text
          border: '#E8E8E8',       // Crisp clean borders
          bg: '#FAFAFA',           // Soft off-white canvas
        },
        ink: '#1A1A1A',
        paper: '#FFFFFF',
        canvas: '#FAFAFA',
        brand: '#FC2779',
        'brand-dark': '#D81B60',
        'brand-soft': '#FFF0F5',
        clay: '#E53935',
        marigold: '#F59E0B',
        malachite: '#10B981',
        vermilion: '#FC2779',
        amethyst: '#8B5CF6',
        magenta: '#FC2779',
        cerulean: '#0EA5E9',
        amber: '#F59E0B',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'nykaa-sm': '0 1px 4px 0 rgba(0, 0, 0, 0.08)',
        'nykaa-card': '0 2px 10px 0 rgba(0, 0, 0, 0.06)',
        'nykaa-hover': '0 8px 24px 0 rgba(252, 39, 121, 0.15)',
        'nykaa-pink': '0 4px 14px 0 rgba(252, 39, 121, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
