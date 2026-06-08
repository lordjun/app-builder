import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { SIGNATURE_POSITIONS, signPdf } from './signPdf';

async function makePdfFile(): Promise<File> {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 400]);
  const bytes = await pdf.save();
  return new File([toArrayBuffer(bytes)], 'unsigned.pdf', { type: 'application/pdf' });
}

describe('signPdf', () => {
  it('returns a valid PDF with the original page count', async () => {
    const signedBytes = await signPdf(await makePdfFile(), 'Jane Doe');

    const signed = await PDFDocument.load(signedBytes);
    expect(signed.getPageCount()).toBe(1);
  });

  it('rejects blank signatures', async () => {
    await expect(signPdf(await makePdfFile(), '   ')).rejects.toThrow('Signature text is required.');
  });

  it('supports all text signature positions', async () => {
    for (const position of SIGNATURE_POSITIONS) {
      const signedBytes = await signPdf(await makePdfFile(), {
        type: 'text',
        text: 'Jane Doe',
        position,
      });

      const signed = await PDFDocument.load(signedBytes);
      expect(signed.getPageCount()).toBe(1);
    }
  });

  it('supports PNG image signatures', async () => {
    const signedBytes = await signPdf(await makePdfFile(), {
      type: 'image',
      imageBytes: onePixelPng,
      position: 'bottom-right',
    });

    const signed = await PDFDocument.load(signedBytes);
    expect(signed.getPageCount()).toBe(1);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const onePixelPng = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 15, 4, 0,
  9, 251, 3, 253, 167, 181, 196, 199, 0, 0, 0, 0, 73, 69, 78, 68,
  174, 66, 96, 130,
]);
