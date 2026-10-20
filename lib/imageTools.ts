import sharp from 'sharp';

// A 64-bit "difference hash". The same picture, resized or re-compressed, gets (nearly) the
// same hash, so two uploads of one image can be spotted. It does NOT catch heavy crops or edits.
export async function dHash(input: Buffer): Promise<string> {
  const { data, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .grayscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = (x: number, y: number) => data[(y * 9 + x) * info.channels];
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += px(x, y) > px(x + 1, y) ? '1' : '0';
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

// Number of differing bits between two hashes. Small = very similar pictures.
export function hamming(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let v = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (v) {
      distance += v & 1;
      v >>= 1;
    }
  }
  return distance;
}

// The public version of an artwork: smaller (max 1000px) and covered in a tiled mark.
// The mark is drawn from shapes, not text, so it renders the same on any server.
export async function makePreview(input: Buffer): Promise<Buffer> {
  const resized = await sharp(input)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = resized.info;
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <pattern id="p" width="170" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
        <g fill="#ffffff" fill-opacity="0.38" stroke="#000000" stroke-opacity="0.28" stroke-width="2">
          <circle cx="58" cy="85" r="22"/>
          <circle cx="86" cy="85" r="22"/>
          <circle cx="110" cy="85" r="19"/>
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#p)"/>
  </svg>`;

  return sharp(resized.data)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .jpeg({ quality: 72 })
    .toBuffer();
}
