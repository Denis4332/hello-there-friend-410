import { describe, it, expect } from 'vitest';
import { mockProfile } from '@/test/utils/mock-data';

describe('ProfileCard', () => {
  it('has valid mock data', () => {
    expect(mockProfile.display_name).toBe('Test User');
    expect(mockProfile.age).toBe(25);
    expect(mockProfile.city).toBe('Zürich');
  });
});
