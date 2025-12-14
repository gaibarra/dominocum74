import { describe, it, expect } from 'vitest';
import { validateAndParseScore } from '@/lib/utils.js';

describe('validateAndParseScore', () => {
  it('returns 0 on empty', () => {
    expect(validateAndParseScore('')).toBe(0);
    expect(validateAndParseScore(null)).toBe(0);
    expect(validateAndParseScore(undefined)).toBe(0);
  });
  it('parses integers', () => {
    expect(validateAndParseScore(' 12 ')).toBe(12);
    expect(validateAndParseScore('0')).toBe(0);
  });
  it('returns null on invalid', () => {
    expect(validateAndParseScore('abc')).toBeNull();
  });
});
