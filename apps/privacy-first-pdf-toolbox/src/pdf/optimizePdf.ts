import { PDFDocument } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export type OptimizedPdf = {
  bytes: Uint8Array;
  optimizedSize: number;
  originalSize: number;
};

export async function optimizePdf(file: File): Promise<OptimizedPdf> {
  const originalBytes = await readFileBytes(file);
  const input = await PDFDocument.load(originalBytes);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(input, input.getPageIndices());

  for (const page of pages) {
    output.addPage(page);
  }

  const bytes = await output.save({ useObjectStreams: true });
  return {
    bytes,
    optimizedSize: bytes.length,
    originalSize: file.size || originalBytes.length,
  };
}
