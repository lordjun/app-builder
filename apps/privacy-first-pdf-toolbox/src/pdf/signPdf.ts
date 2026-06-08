import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export async function signPdf(file: File, signatureText: string): Promise<Uint8Array> {
  const trimmed = signatureText.trim();
  if (!trimmed) {
    throw new Error('Signature text is required.');
  }

  const pdf = await PDFDocument.load(await readFileBytes(file));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const firstPage = pdf.getPage(0);
  const { width } = firstPage.getSize();

  firstPage.drawText(trimmed, {
    x: Math.max(36, width - 180),
    y: 48,
    size: 18,
    font,
    color: rgb(0.05, 0.12, 0.16)
  });

  return pdf.save();
}
