const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const adminKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);

if (!urlMatch || !adminKeyMatch) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), adminKeyMatch[1].trim(), {
  auth: { persistSession: false },
});

const ARTISTS_DATA = [
  {
    email: 'aarav.mehta@artelio.in',
    name: 'Aarav Mehta',
    bio: 'Contemporary abstract expressionist blending heritage earth pigments with textured impasto techniques.',
    upi: 'aaravmehta@upi',
  },
  {
    email: 'priya.sundaram@artelio.in',
    name: 'Priya Sundaram',
    bio: 'Renowned Chennai-based colorist specializing in botanical watercolors and South Asian figurative art.',
    upi: 'priya.art@okhdfcbank',
  },
  {
    email: 'vikram.rao@artelio.in',
    name: 'Vikramaditya Rao',
    bio: 'Minimalist printmaker exploring monochrome ink on hand-pressed mulberry archival sheets.',
    upi: 'vikramrao@icici',
  },
  {
    email: 'elena.rostova@artelio.in',
    name: 'Elena Rostova',
    bio: 'Classical realist trained in Florence, exploring figurative light and atmosphere on Belgian linen.',
    upi: 'elena.fineart@upi',
  },
];

const ARTWORKS_DATA = [
  {
    title: 'Saffron Horizon at Dusk',
    description: 'An evocative abstract canvas inspired by the sunset over Thar desert, utilizing heavy oil texture and gold leaf accents.',
    medium: 'Oil on Canvas',
    price: 18500,
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 0,
  },
  {
    title: 'Whispers of the Banaras Ghats',
    description: 'Textured acrylic portraying morning mist over holy riverbanks, geometric temples, and reflection of prayer lanterns.',
    medium: 'Acrylic on Linen',
    price: 24000,
    image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 0,
  },
  {
    title: 'Metamorphosis in Indigo',
    description: 'A study in organic balance: deep indigo minerals contrasting against luminous raw linen and gold accents.',
    medium: 'Mixed Media on Wood Panel',
    price: 32000,
    image_url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 0,
  },
  {
    title: 'Monsoon Over the Western Ghats',
    description: 'Luminous watercolor washes capturing dramatic cloud formations and rain-drenched cardamom hills.',
    medium: 'Watercolor on Arches Paper',
    price: 8500,
    image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 1,
  },
  {
    title: 'Serenity by the Lotus Pond',
    description: 'Delicate botanical study celebrating the lotus blossom in traditional wash technique with contemporary minimalism.',
    medium: 'Watercolor & Ink',
    price: 7800,
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 1,
  },
  {
    title: 'Solitude in the Thar',
    description: 'Expressive monochrome landscape rendered with compressed willow charcoal, emphasizing desert silence and shadows.',
    medium: 'Charcoal & Graphite on Paper',
    price: 6200,
    image_url: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 2,
  },
  {
    title: 'Sacred Geometry of the Mandala',
    description: 'Precision pen and archival ink composition fusing Vedic sacred geometry with modern constructivism.',
    medium: 'Ink on Mulberry Paper',
    price: 14500,
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 2,
  },
  {
    title: 'The Flute Player in Twilight',
    description: 'Classical figurative portrait capturing gentle chiaroscuro light falling across pastoral twilight.',
    medium: 'Oil on Belgian Canvas',
    price: 28000,
    image_url: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 3,
  },
  {
    title: 'The Golden Hour at Marine Drive',
    description: 'Atmospheric cityscape portraying the Mumbai shoreline glowing under amber sunset skies with textured wave crests.',
    medium: 'Oil on Canvas',
    price: 36500,
    image_url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 3,
  },
  {
    title: 'Digital Dreamscapes: Cyber Lotus',
    description: 'High-resolution generative archival digital piece exploring fluorescent botanicals in an electronic realm.',
    medium: 'Digital Fine Art',
    price: 4500,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    is_digital: true,
    artistIndex: 1,
  },
  {
    title: 'Abstract Rhapsody in Crimson',
    description: 'Vibrant impasto strokes with palette knife execution, radiating passion, warmth, and vitality.',
    medium: 'Acrylic Impasto on Canvas',
    price: 19800,
    image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 0,
  },
  {
    title: 'Echoes of Hampi',
    description: 'A tribute to Vijayanagara architecture: soft pastels and sepia ink capturing monolithic boulder landscapes.',
    medium: 'Pastel & Charcoal',
    price: 11000,
    image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 2,
  },
  {
    title: 'Dancing Shadows in the Courtyard',
    description: 'A study of historic Haveli courtyard balconies with interplay of cast shadows and warm afternoon sun.',
    medium: 'Oil on Linen',
    price: 21500,
    image_url: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=1200&auto=format&fit=crop&q=80',
    is_digital: false,
    artistIndex: 3,
  },
  {
    title: 'Cosmic Dance',
    description: 'Fine art digital archival print depicting swirling celestial nebulae woven with sacred cosmic motifs.',
    medium: 'Digital Archival Print',
    price: 3800,
    image_url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
    is_digital: true,
    artistIndex: 0,
  },
];

async function seed() {
  console.log('--- Starting Artelio Fake Data Seeder ---');

  // 1. Fetch or create artists
  const artistIds = [];
  const { data: existingAuth } = await supabase.auth.admin.listUsers();
  const existingUsers = existingAuth?.users || [];

  for (const aData of ARTISTS_DATA) {
    let u = existingUsers.find((x) => x.email === aData.email);
    if (!u) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: aData.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { name: aData.name, role: 'artist', verified: true },
      });
      if (error) {
        console.error('Failed creating auth artist:', aData.email, error.message);
        continue;
      }
      u = created.user;
      console.log('Created auth artist:', aData.name);
    } else {
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: { ...(u.user_metadata || {}), name: aData.name, role: 'artist', verified: true },
      });
    }

    // Upsert into public.users
    await supabase.from('users').upsert({
      id: u.id,
      name: aData.name,
      email: aData.email,
      role: 'artist',
      bio: aData.bio,
      approved: true,
      payout_method: 'upi',
      payout_upi_id: aData.upi,
    });

    artistIds.push(u.id);
  }

  // Also verify existing artist "Jack" and "Artist2"
  const jack = existingUsers.find((x) => x.email === 'bhosalegurudatta2248663@gmail.com');
  if (jack) {
    await supabase.auth.admin.updateUserById(jack.id, {
      user_metadata: { ...(jack.user_metadata || {}), verified: true },
    });
    artistIds.push(jack.id);
  }

  console.log(`Available Artists for Artworks: ${artistIds.length}`);

  // 2. Insert Artworks
  const createdArtworkIds = [];
  for (let i = 0; i < ARTWORKS_DATA.length; i++) {
    const art = ARTWORKS_DATA[i];
    const targetArtistId = artistIds[art.artistIndex % artistIds.length];

    // Check if artwork with same title exists
    const { data: existing } = await supabase
      .from('artworks')
      .select('id')
      .eq('title', art.title)
      .maybeSingle();

    if (existing) {
      createdArtworkIds.push(existing.id);
      continue;
    }

    const { data: inserted, error: artErr } = await supabase
      .from('artworks')
      .insert({
        artist_id: targetArtistId,
        title: art.title,
        description: art.description,
        medium: art.medium,
        price: art.price,
        image_url: art.image_url,
        is_digital: Boolean(art.is_digital),
        sold: false,
        is_ai_assisted: false,
      })
      .select('id')
      .single();

    if (artErr) {
      console.error(`Failed inserting artwork "${art.title}":`, artErr.message);
    } else if (inserted) {
      createdArtworkIds.push(inserted.id);
      console.log(`Inserted artwork: "${art.title}" (₹${art.price.toLocaleString('en-IN')})`);
    }
  }

  console.log(`Total active artworks available: ${createdArtworkIds.length}`);

  // 3. Create completed orders & payouts so Aarav Mehta and Jack qualify for /admin/verification (>=10 sales, 0 disputes)
  const customerUser = existingUsers.find((x) => x.email === 'bhosalegurudatta2007@gmail.com') || existingUsers[0];
  const targetVerifiedArtistId = artistIds[0]; // Aarav Mehta

  // Check how many orders exist for this artist
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('id')
    .limit(100);

  const neededOrders = Math.max(0, 11 - (existingOrders?.length || 0));
  console.log(`Creating ${neededOrders} completed delivered orders to satisfy verification criteria...`);

  const sampleCities = [
    { city: 'Mumbai', state: 'Maharashtra', pin: '400001' },
    { city: 'New Delhi', state: 'Delhi', pin: '110001' },
    { city: 'Bengaluru', state: 'Karnataka', pin: '560001' },
    { city: 'Jaipur', state: 'Rajasthan', pin: '302001' },
    { city: 'Kolkata', state: 'West Bengal', pin: '700001' },
  ];

  for (let k = 0; k < neededOrders; k++) {
    const artworkId = createdArtworkIds[k % createdArtworkIds.length];
    const loc = sampleCities[k % sampleCities.length];

    const { data: order, error: ordErr } = await supabase
      .from('orders')
      .insert({
        artwork_id: artworkId,
        customer_id: customerUser.id,
        status: 'delivered',
        shipping_name: 'Collector S. Verma',
        shipping_phone: '+91 98201 12345',
        shipping_address: `${100 + k}, Heritage Boulevard, Palm Enclave`,
        shipping_city: loc.city,
        shipping_state: loc.state,
        shipping_postal_code: loc.pin,
        courier_name: 'BlueDart Express',
        tracking_url: 'https://bluedart.com/track/sample',
        delivered_at: new Date(Date.now() - k * 86400000 * 3).toISOString(),
      })
      .select('id')
      .single();

    if (ordErr || !order) {
      console.error('Order creation error:', ordErr?.message);
      continue;
    }

    // Insert payout
    const saleAmount = 15000 + k * 2000;
    const comm = Math.round(saleAmount * 0.1);
    await supabase.from('payouts').insert({
      order_id: order.id,
      artist_id: targetVerifiedArtistId,
      sale_amount: saleAmount,
      commission_amount: comm,
      payout_amount: saleAmount - comm,
      status: 'released',
      released_at: new Date().toISOString(),
    });

    // Insert collector review
    const comments = [
      'Stunning artwork! The texture and lighting in person are even more magnificent than the preview.',
      'Impeccable gallery packaging and arrived on time. An absolute centerpiece for our living salon.',
      'Masterful brushwork. A cherished addition to our family art collection.',
      'Exceptional depth and color harmony. Highly recommended resident creator.',
    ];

    await supabase.from('reviews').insert({
      order_id: order.id,
      artist_id: targetVerifiedArtistId,
      reviewer_id: customerUser.id,
      rating: 5,
      comment: comments[k % comments.length],
    });
  }

  // 4. Seed favorites for the admin user
  const adminUser = existingUsers.find((x) => x.email === 'bhosalegurudatta@gmail.com');
  if (adminUser && createdArtworkIds.length > 0) {
    for (let f = 0; f < Math.min(4, createdArtworkIds.length); f++) {
      await supabase.from('favorites').upsert({
        user_id: adminUser.id,
        artwork_id: createdArtworkIds[f],
      });
    }
    console.log('Seeded favorites for admin account.');
  }

  console.log('--- Fake Data Seeding Completed Successfully! ---');
}

seed().catch(console.error);
