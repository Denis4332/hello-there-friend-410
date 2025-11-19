import { ProfileWithRelations } from '@/types/common';

/**
 * Sorts profiles by listing type with weighted random + time-decay.
 * TOP > Premium > Basic, with fair rotation for profiles within same tier.
 * Rotation changes every 30 minutes to prevent gaming and ensure stability.
 */
export const sortProfilesByListingType = (profiles: ProfileWithRelations[]): ProfileWithRelations[] => {
  const now = Date.now();
  const sessionSeed = Math.floor(now / (30 * 60 * 1000)); // Rotation every 30min
  
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
    
    // 3. WEIGHTED RANDOM with Time-Decay (within same tier)
    const calculateAge = (createdAt: string) => {
      return (now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    };
    
    const ageA = calculateAge(a.created_at);
    const ageB = calculateAge(b.created_at);
    
    // Time-Decay: Older profiles get less weight
    // After 30 days: 50% weight, after 60 days: 33% weight
    const weightA = 1 / (1 + ageA * 0.033);
    const weightB = 1 / (1 + ageB * 0.033);
    
    // Pseudo-Random based on ID + SessionSeed (stable for 30min)
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    const randomA = (hashCode(a.id + sessionSeed) % 1000) / 1000 * weightA;
    const randomB = (hashCode(b.id + sessionSeed) % 1000) / 1000 * weightB;
    
    return randomB - randomA;
  });
};
