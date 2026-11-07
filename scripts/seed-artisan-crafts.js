const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > -1) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    envVars[k] = v;
  }
});

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Seeding artisan crafts and updating artists with UPI & QR codes...');

  // 1. Get or create creator accounts
  const { data: existingArtists } = await sb.from('users').select('*').eq('role', 'artist');
  let artisanArtist = existingArtists?.find(a => a.email.includes('ananya') || a.email.includes('craft'));

  if (!artisanArtist && existingArtists?.length > 0) {
    artisanArtist = existingArtists[0];
  }

  // Update artist with realistic UPI ID and QR code reference
  if (artisanArtist) {
    await sb.from('users').update({
      payout_method: 'upi',
      payout_upi_id: 'ananya.crafts@okaxis',
      payout_account_holder: artisanArtist.name || 'Ananya Verma',
      payout_bank_name: '/artworks/handmade-velvet-diyas.jpg', // QR code / photo reference
    }).eq('id', artisanArtist.id);
  }

  const artistId = artisanArtist ? artisanArtist.id : null;
  if (!artistId) {
    console.error('No artist found to attach artworks to.');
    return;
  }

  // 4 curated artisanal artworks from user's uploaded images
  // Asking price + 10% commission = Listed Price
  const crafts = [
    {
      title: 'Handcrafted Velvet Floral Festive Diyas (Set of 6)',
      description: 'Exquisite hand-assembled festive Diwali tea-light holders handcrafted with rich velvet petals, gold-finish filigree cups, and genuine pearl beading. Glow brighter this festive season with authentic Indian handcrafted heritage decor.',
      medium: 'Handcrafted Velvet, Brass Filigree & Pearl Embellishment',
      asking_price: 799,
      price: Math.round(799 * 1.10), // ₹879 (includes 10% platform commission)
      image_url: '/artworks/handmade-velvet-diyas.jpg',
      is_digital: false,
      sold: false,
      artist_id: artistId,
    },
    {
      title: 'Botanical Mosaic Ceramic Mushroom Lamp',
      description: 'Artisan handcrafted ceramic mushroom accent lamp featuring hand-carved floral motifs, stained glass leaf mosaic inlays, and textured earthen clay finish. Emits a soothing ambient glow perfect for bedside or studio decor.',
      medium: 'Hand-thrown Ceramic, Glazed Terra Cotta & Glass Mosaic',
      asking_price: 2499,
      price: Math.round(2499 * 1.10), // ₹2,749 (includes 10% platform commission)
      image_url: '/artworks/ceramic-mosaic-mushroom-lamp.png',
      is_digital: false,
      sold: false,
      artist_id: artistId,
    },
    {
      title: 'Artisan Natural Driftwood Sculptural Edison Lamp',
      description: 'One-of-a-kind functional art piece crafted from reclaimed aged teak driftwood, hand-sanded and polished with natural beeswax. Accompanied by a vintage amber spiral filament Edison bulb on an artisan turned-wood base.',
      medium: 'Reclaimed Teak Driftwood, Brass Hardware & Amber Filament',
      asking_price: 3999,
      price: Math.round(3999 * 1.10), // ₹4,399 (includes 10% platform commission)
      image_url: '/artworks/artisan-driftwood-lamp.jpg',
      is_digital: false,
      sold: false,
      artist_id: artistId,
    },
    {
      title: 'Twillumi Artisan Velvet Lotus Diya Set with Pearl Trim',
      description: 'Signature Twillumi designer velvet lotus tea-light holders with delicate pearl rims and gold filigree candle cups. Handcrafted with love in vibrant fuchsia, sunflower yellow, and vermilion red for sacred festivities and luxury gifting.',
      medium: 'Velvet Ribbon Craft, Gold-Plated Diya & Seed Pearls',
      asking_price: 1199,
      price: Math.round(1199 * 1.10), // ₹1,319 (includes 10% platform commission)
      image_url: '/artworks/twillumi-lotus-diyas.jpg',
      is_digital: false,
      sold: false,
      artist_id: artistId,
    },
  ];

  for (const craft of crafts) {
    const { asking_price, ...insertData } = craft;
    // Check if already exists
    const { data: existing } = await sb.from('artworks').select('id').eq('title', craft.title).maybeSingle();
    if (existing) {
      console.log(`Updating existing artwork: ${craft.title}`);
      await sb.from('artworks').update(insertData).eq('id', existing.id);
    } else {
      console.log(`Inserting new craft artwork: ${craft.title}`);
      await sb.from('artworks').insert(insertData);
    }
  }

  console.log('Artisan crafts seeded successfully!');
}

seed().catch(console.error);
