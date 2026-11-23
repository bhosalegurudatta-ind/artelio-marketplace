const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.trim().split('=').map((v, i, a) => (i === 0 ? v : a.slice(1).join('='))))
);

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function dHash(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .grayscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = (x, y) => data[(y * 9 + x) * info.channels];
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += px(x, y) > px(x + 1, y) ? '1' : '0';
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

async function run() {
  console.log('Fetching artworks without image_hash...');
  const { data: arts, error } = await sb.from('artworks').select('id, title, image_url, image_hash');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  for (const art of arts) {
    if (art.image_hash) {
      console.log(`Skipping "${art.title}" (already has hash: ${art.image_hash})`);
      continue;
    }
    if (!art.image_url) {
      console.log(`No image_url for "${art.title}"`);
      continue;
    }

    try {
      console.log(`Processing "${art.title}"... (${art.image_url.slice(0, 50)}...)`);
      let buf;
      if (art.image_url.startsWith('data:')) {
        const base64Data = art.image_url.split(',')[1];
        buf = Buffer.from(base64Data, 'base64');
      } else {
        const res = await fetch(art.image_url);
        if (!res.ok) {
          console.error(`Failed to fetch image for "${art.title}": HTTP ${res.status}`);
          continue;
        }
        buf = Buffer.from(await res.arrayBuffer());
      }

      const hash = await dHash(buf);
      const { error: updErr } = await sb.from('artworks').update({ image_hash: hash }).eq('id', art.id);
      if (updErr) {
        console.error(`Failed to update hash for "${art.title}":`, updErr);
      } else {
        console.log(`✓ Set dHash for "${art.title}" -> ${hash}`);
      }
    } catch (e) {
      console.error(`Error processing "${art.title}":`, e.message);
    }
  }
  console.log('Done backfilling hashes!');
}

run();
