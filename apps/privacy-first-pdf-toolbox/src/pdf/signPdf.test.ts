import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { signPdf } from './signPdf';

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
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
