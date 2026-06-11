import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { splitPdf } from './splitPdf';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) {
    pdf.addPage([200, 200]);
  }
  const bytes = await pdf.save();
  return new File([toArrayBuffer(bytes)], name, { type: 'application/pdf' });
}

describe('splitPdf', () => {
  it('exports only the selected pages', async () => {
    const bytes = await splitPdf(await makePdfFile('source.pdf', 5), '1-2,5');

    const output = await PDFDocument.load(bytes);
    expect(output.getPageCount()).toBe(3);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
