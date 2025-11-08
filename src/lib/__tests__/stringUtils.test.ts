import { describe, it, expect } from 'vitest';
import { normalizeSlug, truncate, capitalize } from '../stringUtils';

describe('stringUtils', () => {
  describe('normalizeSlug', () => {
    it('converts text to lowercase', () => {
      expect(normalizeSlug('TEST')).toBe('test');
    });

    it('replaces umlauts correctly', () => {
      expect(normalizeSlug('Zürich')).toBe('zuerich');
      expect(normalizeSlug('München')).toBe('muenchen');
      expect(normalizeSlug('Österreich')).toBe('oesterreich');
      expect(normalizeSlug('Straße')).toBe('strasse');
    });

    it('replaces spaces with hyphens', () => {
      expect(normalizeSlug('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(normalizeSlug('Hello@World!')).toBe('hello-world');
      expect(normalizeSlug('Test & Test')).toBe('test-test');
    });

    it('removes leading and trailing hyphens', () => {
      expect(normalizeSlug('-test-')).toBe('test');
    });

    it('handles complex strings', () => {
      expect(normalizeSlug('Zürich - Hauptbahnhof (HB)')).toBe('zuerich-hauptbahnhof-hb');
    });
  });

  describe('truncate', () => {
    it('returns text unchanged if shorter than maxLength', () => {
      expect(truncate('Short text', 20)).toBe('Short text');
    });

    it('truncates text and adds ellipsis', () => {
      expect(truncate('This is a very long text', 10)).toBe('This is...');
    });

    it('handles exact length correctly', () => {
      expect(truncate('Exactly 10', 10)).toBe('Exactly 10');
    });

    it('handles empty strings', () => {
      expect(truncate('', 10)).toBe('');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('does not change already capitalized text', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('only capitalizes first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });
});
