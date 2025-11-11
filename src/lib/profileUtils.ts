import { ProfileWithRelations } from '@/types/common';

/**
 * Sorts profiles by listing type (TOP > Premium > Basic),
 * then by verification status, then by creation date (newest first)
 */
export const sortProfilesByListingType = (profiles: ProfileWithRelations[]): ProfileWithRelations[] => {
  return [...profiles].sort((a, b) => {
    // 1. LISTING TYPE (highest priority)
    const listingOrder: Record<string, number> = { top: 3, premium: 2, basic: 1 };
    const aOrder = listingOrder[a.listing_type || 'basic'];
    const bOrder = listingOrder[b.listing_type || 'basic'];
    if (aOrder !== bOrder) return bOrder - aOrder;
    
    // 2. VERIFIED (second priority)
    const aVerified = a.verified_at ? 1 : 0;
    const bVerified = b.verified_at ? 1 : 0;
    if (aVerified !== bVerified) return bVerified - aVerified;
    
    // 3. NEWEST (last priority)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};
