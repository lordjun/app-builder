import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createPdfFromImages } from './imageToPdf';

const onePixelPng = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0,
  9, 251, 3, 253, 167, 181, 196, 199, 0, 0, 0, 0, 73, 69, 78, 68,
  174, 66, 96, 130
]);

describe('createPdfFromImages', () => {
  it('creates one PDF page per image', async () => {
    const pdfBytes = await createPdfFromImages([
      new File([onePixelPng], 'one.png', { type: 'image/png' }),
      new File([onePixelPng], 'two.png', { type: 'image/png' })
    ]);

    const pdf = await PDFDocument.load(pdfBytes);
    expect(pdf.getPageCount()).toBe(2);
  });
});
