# Artelio Marketplace: start here

1. Unzip this folder somewhere simple, for example C:\artelio-marketplace
2. Make a copy of `.env.local.example` and name the copy `.env.local`. Fill in your keys (see comments inside).
   Your Supabase project is the same as before, so the URL and keys come from the same dashboard pages.
3. Open a terminal in this folder (type `cmd` in the File Explorer address bar, press Enter), then run:
       npm install
       npm run dev
4. Open http://localhost:3000

The database update (`supabase-update.sql`) is only needed once. You have already run it, so do NOT run it again.
