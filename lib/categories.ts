// Artists type the medium as free text (for example "Oil on canvas"), so each
// category matches on keywords inside that text rather than on an exact value.
export type Category = { slug: string; label: string; keywords: string[] };

export const CATEGORIES: Category[] = [
  { slug: 'customised-sketches', label: 'Customised Sketches & Portraits', keywords: ['custom', 'sketch', 'portrait', 'graphite', 'pencil', 'commission', 'drawing'] },
  { slug: 'crafts', label: 'Handcrafted Heritage & Decor', keywords: ['craft', 'velvet', 'diya', 'pearl', 'filigree', 'decor', 'charm', 'bow', 'keychain'] },
  { slug: 'sculpture', label: 'Sculpture, Metalcraft & Wood Carving', keywords: ['sculpt', 'wood', 'carv', 'teak', 'relief', 'bidri', 'metal', 'silver', 'alloy', 'clay', 'ceramic'] },
  { slug: 'paintings', label: 'Paintings', keywords: ['paint', 'oil', 'acrylic', 'watercolo', 'gouache', 'canvas'] },
  { slug: 'drawings', label: 'Drawings & Sketches', keywords: ['draw', 'sketch', 'charcoal', 'pencil', 'pastel', 'ink'] },
  { slug: 'digital', label: 'Digital Art', keywords: ['digital', 'illustration', 'vector'] },
  { slug: 'photography', label: 'Photography', keywords: ['photo'] },
  { slug: 'mixed', label: 'Mixed Media', keywords: ['mixed', 'collage'] },
];

export function findCategory(slug: string | null): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
