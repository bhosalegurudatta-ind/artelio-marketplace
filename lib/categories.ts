// Artists type the medium as free text (for example "Oil on canvas"), so each
// category matches on keywords inside that text rather than on an exact value.
export type Category = { slug: string; label: string; keywords: string[] };

export const CATEGORIES: Category[] = [
  { slug: 'crafts', label: 'Handcrafted Heritage & Decor', keywords: ['craft', 'velvet', 'diya', 'pearl', 'filigree', 'decor'] },
  { slug: 'sculpture', label: 'Sculptural Lighting & Woodwork', keywords: ['sculpt', 'clay', 'ceramic', 'driftwood', 'wood', 'lamp', 'mosaic', 'metal'] },
  { slug: 'paintings', label: 'Paintings', keywords: ['paint', 'oil', 'acrylic', 'watercolo', 'gouache', 'canvas'] },
  { slug: 'drawings', label: 'Drawings & Sketches', keywords: ['draw', 'sketch', 'charcoal', 'pencil', 'pastel', 'ink'] },
  { slug: 'digital', label: 'Digital Art', keywords: ['digital', 'illustration', 'vector'] },
  { slug: 'photography', label: 'Photography', keywords: ['photo'] },
  { slug: 'mixed', label: 'Mixed Media', keywords: ['mixed', 'collage'] },
];

export function findCategory(slug: string | null): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
