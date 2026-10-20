// Artists type the medium as free text (for example "Oil on canvas"), so each
// category matches on keywords inside that text rather than on an exact value.
export type Category = { slug: string; label: string; keywords: string[] };

export const CATEGORIES: Category[] = [
  { slug: 'paintings', label: 'Paintings', keywords: ['paint', 'oil', 'acrylic', 'watercolo', 'gouache', 'canvas'] },
  { slug: 'drawings', label: 'Drawings & Sketches', keywords: ['draw', 'sketch', 'charcoal', 'pencil', 'pastel', 'ink'] },
  { slug: 'digital', label: 'Digital Art', keywords: ['digital', 'illustration', 'vector'] },
  { slug: 'prints', label: 'Prints', keywords: ['print', 'lithograph'] },
  { slug: 'photography', label: 'Photography', keywords: ['photo'] },
  { slug: 'mixed', label: 'Mixed Media', keywords: ['mixed', 'collage'] },
  { slug: 'sculpture', label: 'Sculpture', keywords: ['sculpt', 'clay', 'ceramic', 'wood', 'metal'] },
];

export function findCategory(slug: string | null): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
