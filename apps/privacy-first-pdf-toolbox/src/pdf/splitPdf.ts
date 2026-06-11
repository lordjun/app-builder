import { PDFDocument } from 'pdf-lib';
import { parsePageRanges } from './pageRanges';
import { readFileBytes } from './readFileBytes';

export async function splitPdf(file: File, pageRanges: string): Promise<Uint8Array> {
  const input = await PDFDocument.load(await readFileBytes(file));
  const output = await PDFDocument.create();
  const selectedPageIndices = parsePageRanges(pageRanges, input.getPageCount());
  const pages = await output.copyPages(input, selectedPageIndices);

  for (const page of pages) {
    output.addPage(page);
  }

  return output.save();
}
