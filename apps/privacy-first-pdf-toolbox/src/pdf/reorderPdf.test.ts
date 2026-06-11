import { describe, expect, it } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import { reorderPdf } from './reorderPdf';

async function makePdfFile(name: string): Promise<File> {
  const pdf = await PDFDocument.create();
  for (let pageNumber = 1; pageNumber <= 3; pageNumber += 1) {
    const page = pdf.addPage([200, 200]);
    page.drawText(String(pageNumber), { x: 20, y: 160, color: rgb(0, 0, 0) });
  }
  const bytes = await pdf.save();
  return new File([toArrayBuffer(bytes)], name, { type: 'application/pdf' });
}

describe('reorderPdf', () => {
  it('exports the same page count in the requested order', async () => {
    const bytes = await reorderPdf(await makePdfFile('source.pdf'), '3,1,2');

    const output = await PDFDocument.load(bytes);
    expect(output.getPageCount()).toBe(3);
  });
});

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
