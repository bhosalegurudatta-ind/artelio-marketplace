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
  creator_pro_monthly: {
    id: 'creator_pro_monthly',
    name: 'Creator Pro',
    targetRole: 'artist',
    price: 499,
    billingInterval: 'month',
    description: 'Empower your studio with state-of-the-art AI art creation, critique lab, and zero sales surcharges.',
    features: [
      'AI Artwork Studio (Concept & Vector Art Generator)',
      'AI Critique Lab (Composition & Palette Direction)',
      'AI Artwork Master Prompt & Style Recipe Engine',
      'Full Studio Listing Access & High-Res Storage',
      'Featured Marketplace Placement',
      'Zero monthly platform commission surcharge',
    ],
    popular: true,
  },
  creator_pro_annual: {
    id: 'creator_pro_annual',
    name: 'Creator Pro Annual',
    targetRole: 'artist',
    price: 4999,
    billingInterval: 'year',
    description: 'Annual studio access with 2 months free, generative art creation tools, and exhibition launch kits.',
    features: [
      'All Creator Pro monthly features',
      'Unlimited AI Artwork Studio generations',
      '2 months free (Save ₹989/yr)',
      'Priority curator review for gallery showcases',
      'Exhibition & Social Media Launch Kit',
    ],
  },
  collector_club_monthly: {
    id: 'collector_club_monthly',
    name: 'Collector Club Pass',
    targetRole: 'customer',
    price: 199,
    billingInterval: 'month',
    description: 'Unlock AI art co-creation, custom commission ideas, and room visualizer tools for your living spaces.',
    features: [
      'AI Artwork Studio (Co-create & Commission Generator)',
      'Unlimited "View on Your Wall" room visualizer',
      'AI Interior Stylist & Decor Color Matcher',
      'High-resolution mockup downloads in My Spaces',
      'Direct private messaging with independent artists',
    ],
    popular: true,
  },
};
