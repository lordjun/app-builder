import { PDFDocument } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await PDFDocument.load(await readFileBytes(file));
  return pdf.getPageCount();
}
