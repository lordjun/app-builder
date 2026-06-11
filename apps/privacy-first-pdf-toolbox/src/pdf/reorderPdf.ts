import { PDFDocument } from 'pdf-lib';
import { parsePageOrder } from './pageOrder';
import { readFileBytes } from './readFileBytes';

export async function reorderPdf(file: File, pageOrder: string): Promise<Uint8Array> {
  const input = await PDFDocument.load(await readFileBytes(file));
  const output = await PDFDocument.create();
  const orderedPageIndices = parsePageOrder(pageOrder, input.getPageCount());
  const pages = await output.copyPages(input, orderedPageIndices);

  for (const page of pages) {
    output.addPage(page);
  }

  return output.save();
}
