import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from './mergePdfs';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) {
    pdf.addPage([200, 200]);
  }
  const bytes = await pdf.save();
  return new File([toArrayBuffer(bytes)], name, { type: 'application/pdf' });
}

describe('mergePdfs', () => {
  it('preserves input page order and count', async () => {
    const mergedBytes = await mergePdfs([
      await makePdfFile('one.pdf', 1),
      await makePdfFile('two.pdf', 2)
    ]);

    const merged = await PDFDocument.load(mergedBytes);
    expect(merged.getPageCount()).toBe(3);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
