import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';

describe('PDF module loading', () => {
  it('keeps PDF processing modules out of the initial App runtime imports', () => {
    expect(appSource).not.toContain("from './pdf/imageToPdf'");
    expect(appSource).not.toContain("from './pdf/mergePdfs'");
    expect(appSource).not.toContain("from './pdf/optimizePdf'");
    expect(appSource).not.toContain("from './pdf/pdfPageCount'");
    expect(appSource).not.toContain("from './pdf/reorderPdf'");
    expect(appSource).not.toContain("from './pdf/splitPdf'");
    expect(appSource).not.toContain('signPdf } from');
  });
});
