// Abstract artwork generated from a seed string. The same seed always produces
// the same picture, so an artwork without a photo keeps a stable look, and the
// site never looks empty before real work is listed.

const SCHEMES = [
  { bg: '#E4452C', shapes: ['#1B1E52', '#F4B63D', '#F3F3EF'] },
  { bg: '#1B1E52', shapes: ['#F4B63D', '#E5799B', '#F3F3EF'] },
  { bg: '#F4B63D', shapes: ['#1B1E52', '#E4452C', '#F3F3EF'] },
  { bg: '#1F8A70', shapes: ['#F3F3EF', '#F4B63D', '#1B1E52'] },
  { bg: '#E5799B', shapes: ['#1B1E52', '#F3F3EF', '#F4B63D'] },
  { bg: '#8EB8E5', shapes: ['#1B1E52', '#E4452C', '#F3F3EF'] },
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GenerativeArt({ seed, className }: { seed: string; className?: string }) {
  const r = rng(hash(seed));
  const range = (a: number, b: number) => a + r() * (b - a);
  const scheme = SCHEMES[Math.floor(r() * SCHEMES.length)];
  const [c1, c2, c3] = scheme.shapes;

  const ring = { x: range(30, 70), y: range(30, 70), r: range(14, 26) };
  const big = { x: range(30, 70), y: range(30, 70), r: range(18, 28) };
  const half = { x: range(15, 55), y: range(50, 85), r: range(10, 20) };
  const bar = { x: range(10, 50), y: range(10, 80), w: range(25, 50), h: range(5, 11), angle: range(-25, 25) };
  const dot = { x: range(15, 85), y: range(15, 85), r: range(3, 7) };

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <rect width="100" height="100" fill={scheme.bg} />
      <circle cx={ring.x} cy={ring.y} r={ring.r} fill="none" stroke={c3} strokeWidth="1.5" />
      <circle cx={big.x} cy={big.y} r={big.r} fill={c1} />
      <path d={`M ${half.x} ${half.y} a ${half.r} ${half.r} 0 0 1 ${half.r * 2} 0 Z`} fill={c2} />
      <rect
        x={bar.x}
        y={bar.y}
        width={bar.w}
        height={bar.h}
        fill={c3}
        transform={`rotate(${bar.angle} ${bar.x + bar.w / 2} ${bar.y + bar.h / 2})`}
      />
      <circle cx={dot.x} cy={dot.y} r={dot.r} fill={c2} />
    </svg>
  );
}
