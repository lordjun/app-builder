import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { optimizePdf } from './optimizePdf';

async function makePdfFile(name: string, pages: number): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) {
    pdf.addPage([200, 200]);
  }
  const bytes = await pdf.save();
  return new File([toArrayBuffer(bytes)], name, { type: 'application/pdf' });
}

describe('optimizePdf', () => {
  it('returns a valid PDF and size stats', async () => {
    const source = await makePdfFile('source.pdf', 2);

    const result = await optimizePdf(source);

    const output = await PDFDocument.load(result.bytes);
    expect(output.getPageCount()).toBe(2);
    expect(result.originalSize).toBe(source.size);
    expect(result.optimizedSize).toBe(result.bytes.length);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
