import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // "Stylish" Figma UI Kit exact color palette
        stylish: {
          red: '#F83758',          // Iconic primary coral-red
          darkred: '#E02244',      // Hover/pressed dark red
          coral: '#FA7189',        // Secondary soft coral
          lightpink: '#FDF0F3',    // Light pink background
          softpink: '#FCF3F6',     // Subdued pink wash
          blue: '#4392F9',         // "Deal of the day" blue
          darkblue: '#2B66B1',
          charcoal: '#17223B',     // Primary black text
          gray: '#626262',         // Secondary gray body
          lightgray: '#F3F3F3',    // Input fields background
          border: '#DEDBDB',       // Clean card borders
          card: '#FFFFFF',
          bg: '#FFFFFF',           // Crisp white canvas
        },
        ink: '#17223B',
        paper: '#FFFFFF',
        canvas: '#FFFFFF',
        brand: '#F83758',
        'brand-dark': '#E02244',
        'brand-soft': '#FDF0F3',
        clay: '#F83758',
        marigold: '#F9A825',
        malachite: '#10B981',
        vermilion: '#F83758',
        amethyst: '#8B5CF6',
        magenta: '#F83758',
        cerulean: '#4392F9',
        amber: '#F9A825',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'stylish-sm': '0 2px 6px 0 rgba(0, 0, 0, 0.06)',
        'stylish-card': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        'stylish-btn': '0 4px 14px 0 rgba(248, 55, 88, 0.35)',
        'stylish-float': '0 8px 24px 0 rgba(248, 55, 88, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
