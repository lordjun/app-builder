import { describe, expect, it } from 'vitest';
import { parsePageOrder } from './pageOrder';

describe('parsePageOrder', () => {
  it('parses a complete page order into zero-based page indices', () => {
    expect(parsePageOrder('3,1,2,4', 4)).toEqual([2, 0, 1, 3]);
  });

  it('supports forward ranges inside the order', () => {
    expect(parsePageOrder('3,1-2,4', 4)).toEqual([2, 0, 1, 3]);
  });

  it('rejects duplicate, missing, and out-of-bounds pages', () => {
    expect(() => parsePageOrder('1,2,2,4', 4)).toThrow('Page 2 appears more than once');
    expect(() => parsePageOrder('1,2,4', 4)).toThrow('Include every page exactly once');
    expect(() => parsePageOrder('1,2,3,5', 4)).toThrow('Page 5 is outside this 4-page PDF');
  });
});
