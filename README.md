# Artelio Marketplace • Contemporary Atelier

An artistic online marketplace where independent creators exhibit and sell original fine art directly to collectors. Features curated physical and digital works, a rich artistic palette aesthetic, Gemini AI listing assistant & spatial interior visualization, and Razorpay escrow payments.

## 🎨 Artistic Atelier Experience
- **Vibrant Fine Art Pigments**: Venetian Vermilion, Tuscan Ochre, French Ultramarine, Verdigris Emerald, and Royal Amethyst.
- **Museum-grade Presentation**: Framed physical mounts, watermarked collector previews, and dynamic generative art canvases.
- **AI Spatial Room Visualizer**: Preview how paintings fit on real room walls in 4K with architectural light & scale analysis.
- **Gemini AI Art Studio & Stylist**: Instant vector masterwork generation, color palette curation, and room harmony matching.

## 🚀 Live Deployment & Links
- **GitHub Repository**: [https://github.com/bhosalegurudatta-ind/artelio-marketplace](https://github.com/bhosalegurudatta-ind/artelio-marketplace)
- **Deployment**: Automatic continuous deployment on push to `main` branch (Vercel / Next.js hosting).

## Run it locally
1. Copy `.env.local.example` to `.env.local` and fill in your keys.
2. `npm install`
3. `npm run dev`, then open http://localhost:3000

## Security design
- Buyers see only a small, watermarked preview. Full-quality files of digital art sit in a private bucket and are
  released through a 60-second link after a paid order. Physical artwork originals are never stored by the platform.
- Prices and buyer identity are always taken from the server, never from the browser.
- Uploads go through a server route that checks the image and refuses duplicates.
- Database access is controlled by Supabase Row Level Security rules (`supabase-schema.sql`, then `supabase-update.sql`).
