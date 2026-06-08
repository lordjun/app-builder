import { describe, expect, it } from 'vitest';
import { normalizePdfFilename } from './outputFilename';

describe('normalizePdfFilename', () => {
  it('adds the pdf extension when it is missing', () => {
    expect(normalizePdfFilename('contract', 'signed.pdf')).toBe('contract.pdf');
  });

  it('keeps an existing pdf extension', () => {
    expect(normalizePdfFilename('contract.pdf', 'signed.pdf')).toBe('contract.pdf');
  });

  it('falls back to the default filename when input is blank', () => {
    expect(normalizePdfFilename('   ', 'merged.pdf')).toBe('merged.pdf');
  });

  it('replaces path-unsafe characters', () => {
    expect(normalizePdfFilename('client/report:final', 'signed.pdf')).toBe('client-report-final.pdf');
  });
});
