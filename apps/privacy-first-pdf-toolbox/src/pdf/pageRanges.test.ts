import { describe, expect, it } from 'vitest';
import { parsePageRanges } from './pageRanges';

describe('parsePageRanges', () => {
  it('parses comma separated pages and ranges into zero-based page indices', () => {
    expect(parsePageRanges('1-3,5', 6)).toEqual([0, 1, 2, 4]);
  });

  it('removes duplicate pages while preserving first occurrence order', () => {
    expect(parsePageRanges('2,1-3,2', 4)).toEqual([1, 0, 2]);
  });

  it('rejects empty, reversed, and out-of-bounds ranges', () => {
    expect(() => parsePageRanges('', 5)).toThrow('Enter page ranges');
    expect(() => parsePageRanges('3-1', 5)).toThrow('Range start must be before range end');
    expect(() => parsePageRanges('1-6', 5)).toThrow('Page 6 is outside this 5-page PDF');
  });
});
