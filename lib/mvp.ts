// Business rules from the Artelio MVP Overview. Change them here, in one place.

export const COMMISSION_RATE = 0.10;      // Artelio keeps 10% commission on every sale (no GST added)
export const TRIAL_DAYS = 30;             // free trial for approved artists
export const DIGITAL_RELEASE_DAYS = 7;    // digital sale: payout released 7 days after download, if no dispute
export const PHYSICAL_RELEASE_DAYS = 10;  // physical sale: payout released 10 days after shipping, if no dispute
export const FUSION_MONTHLY_CAP = 5;       // monthly limit for AI style-fusion generator (free tier)
export const DAY = 24 * 60 * 60 * 1000;

/**
 * Calculates the customer-facing listed price on Artelio.
 * Automatically adds the 10% platform commission on top of the artist's asking price.
 * Formula: Listed Price = Artist Asking Price + 10% Commission
 */
export function calculateListedPrice(askingPrice: number): number {
  if (!askingPrice || askingPrice <= 0) return 0;
  return Math.round(askingPrice * 1.10);
}

/**
 * Splits the customer sale price between the artist and platform admin.
 * Artist receives 100% of their base asking price.
 * Platform admin receives the 10% commission debited to admin ledger.
 */
export function calculateCommissionAndPayout(salePrice: number): {
  artistPayout: number;
  platformCommission: number;
} {
  const price = Number(salePrice) || 0;
  // If price was calculated via askingPrice * 1.10:
  const artistPayout = Math.round(price / 1.10);
  const platformCommission = Math.max(0, price - artistPayout);
  return {
    artistPayout,
    platformCommission,
  };
}

// Lets an artist list work only while the trial or a paid plan is active.
export function hasListingAccess(profile: { trial_ends_at?: string | null; paid_until?: string | null }) {
  const ends = [profile.trial_ends_at, profile.paid_until]
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime());
  return ends.length > 0 && Math.max(...ends) > Date.now();
}

