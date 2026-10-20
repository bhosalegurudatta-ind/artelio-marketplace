// Business rules from the Artelio MVP Overview. Change them here, in one place.

export const COMMISSION_RATE = 0.10;      // Artelio keeps 10% of every sale
export const TRIAL_DAYS = 30;             // free trial for approved artists
export const DIGITAL_RELEASE_DAYS = 7;    // digital sale: payout released 7 days after download, if no dispute
export const PHYSICAL_RELEASE_DAYS = 10;  // physical sale: payout released 10 days after shipping, if no dispute
export const DAY = 24 * 60 * 60 * 1000;

// Lets an artist list work only while the trial or a paid plan is active.
export function hasListingAccess(profile: { trial_ends_at?: string | null; paid_until?: string | null }) {
  const ends = [profile.trial_ends_at, profile.paid_until]
    .filter(Boolean)
    .map((d) => new Date(d as string).getTime());
  return ends.length > 0 && Math.max(...ends) > Date.now();
}
