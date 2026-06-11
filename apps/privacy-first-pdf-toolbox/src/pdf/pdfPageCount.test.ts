import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { getPdfPageCount } from './pdfPageCount';

describe('getPdfPageCount', () => {
  it('returns the page count for a selected PDF file', async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([200, 200]);
    pdf.addPage([200, 200]);
    pdf.addPage([200, 200]);

    const bytes = await pdf.save();
    const file = new File([toArrayBuffer(bytes)], 'three-pages.pdf', { type: 'application/pdf' });

    await expect(getPdfPageCount(file)).resolves.toBe(3);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
