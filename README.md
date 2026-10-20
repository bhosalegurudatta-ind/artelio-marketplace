# Artelio Marketplace

An online marketplace where independent artists sell original art directly to buyers. Artists get an AI listing
assistant (suggested title, description and price range from a photo), buyers pay through Razorpay, and the platform
keeps a 15% commission on each sale.

Built with Next.js 14, TypeScript, Tailwind CSS, Supabase (database, login, storage), Razorpay and the Gemini API.

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
