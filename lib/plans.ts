export interface Plan {
  id: string;
  name: string;
  targetRole: 'artist' | 'customer';
  price: number; // in INR
  billingInterval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, Plan> = {
  artist_pro_monthly: {
    id: 'artist_pro_monthly',
    name: 'Artist Professional',
    targetRole: 'artist',
    price: 999,
    billingInterval: 'month',
    description: "Access to the platform's AI generation tool, watermarking and provenance records, and marketplace listing rights.",
    features: [
      'Platform AI Generation & Style-Fusion Studio',
      'RAG-assisted generation drawing on your own references',
      'Automated watermarking & cryptographic dHash provenance',
      'Zero-custody listing rights (keep your original master files)',
      'Guaranteed 90% net sales payout directly to UPI / bank',
      'Public Provenance Registry verification & serialized CoA',
    ],
    popular: true,
  },
  artist_pro_annual: {
    id: 'artist_pro_annual',
    name: 'Artist Professional Annual',
    targetRole: 'artist',
    price: 9990,
    billingInterval: 'year',
    description: 'Annual professional studio membership with 2 months free, unlimited AI generations, and priority exhibition drops.',
    features: [
      'All Artist Professional monthly features',
      'Unlimited AI Artwork Studio generations',
      '2 months free (Save ₹1,998/yr)',
      'Priority curator review for gallery showcases',
      'Exhibition & Social Media Launch Kit',
      'VIP badge in Artelio Provenance Registry',
    ],
  },
  collector_vip_monthly: {
    id: 'collector_vip_monthly',
    name: 'Collector VIP Pass',
    targetRole: 'customer',
    price: 499,
    billingInterval: 'month',
    description: 'Room and framing previews, early access to limited drops, and private virtual galleries.',
    features: [
      '"View on Your Wall" room and framing previews',
      'Private virtual galleries (My Spaces exhibition rooms)',
      'Early access to limited drops & exclusive atelier releases',
      'AI Interior Stylist & Decor Color Harmony Matcher',
      'Direct private messaging & custom commissions with creators',
      'Lossless digital masterwork download vault',
    ],
    popular: true,
  },
};

// Aliases to maintain backwards compatibility with existing UI / database bindings
SUBSCRIPTION_PLANS.creator_pro_monthly = SUBSCRIPTION_PLANS.artist_pro_monthly;
SUBSCRIPTION_PLANS.creator_pro_annual = SUBSCRIPTION_PLANS.artist_pro_annual;
SUBSCRIPTION_PLANS.collector_club_monthly = SUBSCRIPTION_PLANS.collector_vip_monthly;
