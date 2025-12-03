import { ProfileWithRelations } from '@/types/common';

/**
 * Sorts profiles by listing type with weighted random.
 * TOP > Premium > Basic, with fair rotation for ALL profiles within same tier.
 * Rotation changes every 30 minutes to prevent gaming and ensure stability.
 * 
 * @param profiles - Array of profiles to sort
 * @param sessionSeed - Optional seed for rotation (defaults to current 30-min window)
 */
export const sortProfilesByListingType = (
  profiles: ProfileWithRelations[],
  sessionSeed?: number
): ProfileWithRelations[] => {
  const seed = sessionSeed ?? Math.floor(Date.now() / (30 * 60 * 1000));
  
  // Hash function that truly incorporates the seed mathematically
  const hashWithSeed = (id: string, seedValue: number): number => {
    let hash = seedValue;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash + id.charCodeAt(i)) ^ (seedValue >> (i % 16));
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  return [...profiles].sort((a, b) => {
    // 1. LISTING TYPE (only real priority)
    const listingOrder: Record<string, number> = { top: 3, premium: 2, basic: 1 };
    const aOrder = listingOrder[a.listing_type || 'basic'];
    const bOrder = listingOrder[b.listing_type || 'basic'];
    if (aOrder !== bOrder) return bOrder - aOrder;
    
    // 2. TRUE RANDOM within same tier (NO verification sorting!)
    const randomA = (hashWithSeed(a.id, seed) % 10000) / 10000;
    const randomB = (hashWithSeed(b.id, seed) % 10000) / 10000;
    
    return randomB - randomA;
  });
};
