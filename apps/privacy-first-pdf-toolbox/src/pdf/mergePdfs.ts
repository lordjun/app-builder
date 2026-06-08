import { PDFDocument } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();

  for (const file of files) {
    const input = await PDFDocument.load(await readFileBytes(file));
    const pages = await output.copyPages(input, input.getPageIndices());
    for (const page of pages) {
      output.addPage(page);
    }
  }

  return output.save();
}
