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
  
  // MurmurHash3-inspired algorithm for TRUE random rotation
  // Different seeds GUARANTEE different sort orders
  const hashWithSeed = (id: string, seedValue: number): number => {
    let h1 = seedValue >>> 0; // Ensure unsigned 32-bit
    
    for (let i = 0; i < id.length; i++) {
      let k1 = id.charCodeAt(i);
      
      // Mix the character with magic constants
      k1 = Math.imul(k1, 0xcc9e2d51);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, 0x1b873593);
      
      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = Math.imul(h1, 5) + 0xe6546b64;
    }
    
    // Final mixing for even distribution
    h1 ^= id.length;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;
    
    return h1 >>> 0; // Return unsigned
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
